package com.recipeapp.contexts.recipes.infrastructure

import com.recipeapp.contexts.recipes.domain.Recipe
import com.recipeapp.contexts.recipes.domain.RecipeRepository
import com.recipeapp.infrastructure.database
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import java.util.UUID

/**
 * ADAPTER implementing the domain's RecipeRepository port with Exposed + JDBC.
 * This is the only file in the context allowed to know Postgres exists. Row →
 * domain mapping happens here, so the domain never sees an Exposed ResultRow.
 *
 * Laravel analogue: a Repository implementation bound to an interface in a
 * ServiceProvider — but hand-wired, explicit, no container.
 */
class ExposedRecipeRepository : RecipeRepository {

    override fun findById(id: UUID): Recipe? {
        val db = database ?: error("Database not connected")
        return transaction(db) {
            RecipesTable
                .selectAll()
                .where { RecipesTable.id eq id }
                .limit(1)
                .firstOrNull()
                ?.let(::toDomain)
        }
    }

    override fun list(limit: Int): List<Recipe> {
        val db = database ?: error("Database not connected")
        return transaction(db) {
            RecipesTable
                .selectAll()
                .orderBy(RecipesTable.createdAt)
                .limit(limit)
                .map(::toDomain)
        }
    }

    private fun toDomain(row: org.jetbrains.exposed.v1.core.ResultRow): Recipe =
        Recipe(
            id = row[RecipesTable.id],
            title = row[RecipesTable.title],
            cuisine = row[RecipesTable.cuisine],
            createdAt = row[RecipesTable.createdAt],
        )

    override fun save(recipe: Recipe): Recipe {
        val db = database ?: error("Database not connected")
        return transaction(db) {
            val existing = RecipesTable.selectAll().where { RecipesTable.id eq recipe.id }.firstOrNull()
            if (existing != null) {
                RecipesTable.update({ RecipesTable.id eq recipe.id }) {
                    it[title] = recipe.title
                    it[cuisine] = recipe.cuisine
                }
            } else {
                RecipesTable.insert {
                    it[id] = recipe.id
                    it[title] = recipe.title
                    it[cuisine] = recipe.cuisine
                    it[createdAt] = recipe.createdAt
                }
            }
            recipe
        }
    }

    override fun delete(id: UUID): Boolean {
        val db = database ?: error("Database not connected")
        return transaction(db) {
            RecipesTable.deleteWhere { RecipesTable.id eq id } > 0
        }
    }
}
