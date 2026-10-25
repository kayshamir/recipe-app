package com.recipeapp.infrastructure

import org.flywaydb.core.Flyway
import org.testcontainers.postgresql.PostgreSQLContainer
import java.sql.Connection
import java.sql.DriverManager
import java.sql.SQLException
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class DatabaseMigrationTest {

    @Test
    fun `migrations create reproducible vector storage and cosine search`() {
        val postgres = PostgreSQLContainer(PGVECTOR_IMAGE)
            .withDatabaseName("recipe_test")
            .withUsername("recipe")
            .withPassword("recipe")

        postgres.start()
        try {
            val flyway = Flyway.configure()
                .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
                .locations("classpath:db/migration")
                .load()

            assertEquals(3, flyway.migrate().migrationsExecuted)
            assertEquals(0, flyway.migrate().migrationsExecuted)

            DriverManager.getConnection(postgres.jdbcUrl, postgres.username, postgres.password).use { connection ->
                assertExtensionVersion(connection)
                assertEmbeddingModel(connection)

                val documentId = insertPublishedDocument(connection)
                val firstVersionId = insertDocumentVersion(
                    connection = connection,
                    documentId = documentId,
                    versionNumber = 1,
                    searchableText = "Chicken adobo with soy sauce and vinegar",
                    contentHash = "a".repeat(64),
                )
                val secondVersionId = insertDocumentVersion(
                    connection = connection,
                    documentId = documentId,
                    versionNumber = 2,
                    searchableText = "Chicken adobo with soy sauce, vinegar, and garlic",
                    contentHash = "b".repeat(64),
                )
                val invalidVectorVersionId = insertDocumentVersion(
                    connection = connection,
                    documentId = documentId,
                    versionNumber = 3,
                    searchableText = "A fixture reserved for dimension validation",
                    contentHash = "c".repeat(64),
                )
                val embeddingModelId = activeEmbeddingModelId(connection)

                insertEmbedding(connection, firstVersionId, embeddingModelId, vectorWith(0.0, 1.0))
                insertEmbedding(connection, secondVersionId, embeddingModelId, vectorWith(1.0, 0.0))

                assertNearestVersion(connection, documentId, expectedVersion = 2)
                assertWrongDimensionsAreRejected(connection, invalidVectorVersionId, embeddingModelId)
                assertDocumentHistoryCannotCascadeDelete(connection, documentId)
                assertHnswIndex(connection)
            }
        } finally {
            postgres.stop()
        }
    }

    private fun assertExtensionVersion(connection: Connection) {
        connection.prepareStatement(
            "SELECT extversion FROM pg_extension WHERE extname = 'vector'",
        ).use { statement ->
            statement.executeQuery().use { result ->
                assertTrue(result.next())
                assertEquals("0.8.7", result.getString("extversion"))
            }
        }
    }

    private fun assertEmbeddingModel(connection: Connection) {
        connection.prepareStatement(
            """
            SELECT provider, model_name, dimensions, distance_metric, is_active
              FROM embedding_models
            """.trimIndent(),
        ).use { statement ->
            statement.executeQuery().use { result ->
                assertTrue(result.next())
                assertEquals("ollama", result.getString("provider"))
                assertEquals("nomic-embed-text", result.getString("model_name"))
                assertEquals(768, result.getInt("dimensions"))
                assertEquals("cosine", result.getString("distance_metric"))
                assertTrue(result.getBoolean("is_active"))
                assertTrue(!result.next())
            }
        }
    }

    private fun insertPublishedDocument(connection: Connection): UUID =
        connection.prepareStatement(
            "INSERT INTO knowledge_documents (review_state) VALUES ('published') RETURNING id",
        ).use { statement ->
            statement.executeQuery().use { result ->
                assertTrue(result.next())
                result.getObject("id", UUID::class.java)
            }
        }

    private fun insertDocumentVersion(
        connection: Connection,
        documentId: UUID,
        versionNumber: Int,
        searchableText: String,
        contentHash: String,
    ): UUID = connection.prepareStatement(
        """
        INSERT INTO knowledge_document_versions (
            knowledge_document_id,
            version_number,
            searchable_text,
            content_hash
        ) VALUES (?, ?, ?, ?) RETURNING id
        """.trimIndent(),
    ).use { statement ->
        statement.setObject(1, documentId)
        statement.setInt(2, versionNumber)
        statement.setString(3, searchableText)
        statement.setString(4, contentHash)
        statement.executeQuery().use { result ->
            assertTrue(result.next())
            result.getObject("id", UUID::class.java)
        }
    }

    private fun activeEmbeddingModelId(connection: Connection): UUID =
        connection.prepareStatement(
            "SELECT id FROM embedding_models WHERE is_active",
        ).use { statement ->
            statement.executeQuery().use { result ->
                assertTrue(result.next())
                result.getObject("id", UUID::class.java)
            }
        }

    private fun insertEmbedding(
        connection: Connection,
        documentVersionId: UUID,
        embeddingModelId: UUID,
        embedding: String,
    ) {
        connection.prepareStatement(
            """
            INSERT INTO knowledge_embeddings (
                knowledge_document_version_id,
                embedding_model_id,
                embedding
            ) VALUES (?, ?, ?::vector)
            """.trimIndent(),
        ).use { statement ->
            statement.setObject(1, documentVersionId)
            statement.setObject(2, embeddingModelId)
            statement.setString(3, embedding)
            assertEquals(1, statement.executeUpdate())
        }
    }

    private fun assertNearestVersion(
        connection: Connection,
        expectedDocumentId: UUID,
        expectedVersion: Int,
    ) {
        val queryVector = vectorWith(1.0, 0.0)
        connection.prepareStatement(
            """
            SELECT kd.id AS document_id,
                   kdv.version_number,
                   1 - (ke.embedding <=> ?::vector) AS similarity
              FROM knowledge_embeddings ke
              JOIN knowledge_document_versions kdv
                ON kdv.id = ke.knowledge_document_version_id
              JOIN knowledge_documents kd
                ON kd.id = kdv.knowledge_document_id
             WHERE kd.review_state = 'published'
             ORDER BY ke.embedding <=> ?::vector
             LIMIT 1
            """.trimIndent(),
        ).use { statement ->
            statement.setString(1, queryVector)
            statement.setString(2, queryVector)
            statement.executeQuery().use { result ->
                assertTrue(result.next())
                assertEquals(expectedDocumentId, result.getObject("document_id", UUID::class.java))
                assertEquals(expectedVersion, result.getInt("version_number"))
                assertEquals(1.0, result.getDouble("similarity"), absoluteTolerance = 0.000001)
            }
        }
    }

    private fun assertWrongDimensionsAreRejected(
        connection: Connection,
        documentVersionId: UUID,
        embeddingModelId: UUID,
    ) {
        val exception = assertFailsWith<SQLException> {
            insertEmbedding(connection, documentVersionId, embeddingModelId, "[1,0,0]")
        }
        assertTrue(
            generateSequence<Throwable>(exception) { it.cause }
                .any { it.message?.contains("expected 768 dimensions, not 3") == true },
        )
    }

    private fun assertDocumentHistoryCannotCascadeDelete(
        connection: Connection,
        documentId: UUID,
    ) {
        assertFailsWith<SQLException> {
            connection.prepareStatement(
                "DELETE FROM knowledge_documents WHERE id = ?",
            ).use { statement ->
                statement.setObject(1, documentId)
                statement.executeUpdate()
            }
        }
    }

    private fun assertHnswIndex(connection: Connection) {
        connection.prepareStatement(
            "SELECT indexdef FROM pg_indexes WHERE indexname = 'knowledge_embeddings_cosine_hnsw_idx'",
        ).use { statement ->
            statement.executeQuery().use { result ->
                assertTrue(result.next())
                val definition = result.getString("indexdef").lowercase()
                assertTrue(definition.contains("using hnsw"))
                assertTrue(definition.contains("vector_cosine_ops"))
            }
        }
    }

    private fun vectorWith(first: Double, second: Double): String =
        List(EMBEDDING_DIMENSIONS) { index ->
            when (index) {
                0 -> first
                1 -> second
                else -> 0.0
            }
        }.joinToString(prefix = "[", postfix = "]")

    private companion object {
        const val PGVECTOR_IMAGE = "pgvector/pgvector:0.8.7-pg16"
        const val EMBEDDING_DIMENSIONS = 768
    }
}
