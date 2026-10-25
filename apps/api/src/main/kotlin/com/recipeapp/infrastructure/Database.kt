package com.recipeapp.infrastructure

import io.ktor.server.application.*
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.slf4j.LoggerFactory
import java.sql.SQLException

private val logger = LoggerFactory.getLogger("Database")

/** Resolved once so Exposed and Flyway always point at the same database. */
private data class DbConfig(val url: String, val user: String, val password: String)

private fun dbConfig(): DbConfig = DbConfig(
    url = System.getenv("DATABASE_URL") ?: "jdbc:postgresql://localhost:5432/recipe_dev",
    user = System.getenv("DATABASE_USER") ?: "recipe",
    password = System.getenv("DATABASE_PASSWORD") ?: "recipe",
)

/**
 * Single global JDBC connection for the pilot (ARCHITECTURE.md § 2: coroutine-based,
 * single VM). Swap in a HikariCP DataSource here when load requires pooling.
 *
 * Reads config from environment variables - credentials are never committed
 * (ARCHITECTURE.md § 10 Environment config). Note Database.connect is lazy:
 * it succeeds even with no server reachable; databaseIsHealthy() is the probe.
 */
fun connectToDatabase(): Database {
    val c = dbConfig()
    return Database.connect(
        url = c.url,
        driver = "org.postgresql.Driver",
        user = c.user,
        password = c.password,
    )
}

/**
 * Apply pending Flyway migrations. Flyway owns all DDL (project convention);
 * Exposed only ever runs typed queries. Set AUTO_MIGRATE=false to defer this
 * to CI/a deploy step instead of running it on boot.
 */
private fun runMigrations(c: DbConfig) {
    Flyway.configure()
        .dataSource(c.url, c.user, c.password)
        .locations("classpath:db/migration")
        .load()
        .migrate()
}

/**
 * Connection-class SQL states mean the server cannot be reached. Those remain
 * recoverable in local development; authentication and migration failures do
 * not, because continuing would hide a reachable but incompatible database.
 */
private fun Throwable.isDatabaseUnavailable(): Boolean =
    generateSequence(this) { it.cause }
        .filterIsInstance<SQLException>()
        .any { it.sqlState?.startsWith("08") == true }

var database: Database? = null
    private set

fun Application.configureDatabase() {
    val c = dbConfig()

    if (System.getenv("AUTO_MIGRATE") != "false") {
        try {
            runMigrations(c)
            logger.info("Flyway migrations applied")
        } catch (e: Exception) {
            if (!e.isDatabaseUnavailable()) {
                throw e
            }

            // Dev convenience: keep booting only when no database is reachable.
            logger.warn("Flyway migration skipped - is Postgres running on :5432?", e)
        }
    } else {
        logger.info("AUTO_MIGRATE=false - skipping startup migrations")
    }

    database = try {
        connectToDatabase()
    } catch (e: Exception) {
        logger.warn("Database unavailable at startup; continuing without it", e)
        null
    }

    // Database.connect() is lazy and never opens a socket, so the log line above
    // would lie. Probe for the truth so the startup log matches /healthz.
    if (database != null) {
        if (databaseIsHealthy()) {
            logger.info("Database reachable")
        } else {
            logger.warn(
                "Database configured but NOT reachable - is Postgres running on :5432? " +
                    "Start it via the dev wizard (full-stack launcher) or Docker; " +
                    "/healthz will report database-unavailable until then.",
            )
        }
    }
}

/** True when a real connection round-trips; used by /healthz. */
fun databaseIsHealthy(): Boolean {
    val db = database ?: return false
    return runCatching {
        val conn = db.connector()
        try {
            (conn.connection as java.sql.Connection).isValid(2)
        } finally {
            conn.close()
        }
    }.getOrDefault(false)
}
