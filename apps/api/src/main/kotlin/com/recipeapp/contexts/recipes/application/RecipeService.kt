package com.recipeapp.contexts.recipes.application

import com.recipeapp.contexts.recipes.domain.Recipe
import com.recipeapp.contexts.recipes.domain.RecipeRepository
import java.time.LocalDateTime
import java.util.UUID

/**
 * APPLICATION service — one class per capability, methods are use cases
 * (≈ Laravel's "action" classes or a service you'd inject into a controller).
 *
 * It depends only on the RecipeRepository PORT (domain), never on Exposed or
 * Ktor. Orchestration and validation live here; the controller stays thin and
 * the adapter stays dumb. Swap the repository for an in-memory fake and this
 * class unit-tests with no database.
 */
class ListRecipesUseCase(private val repository: RecipeRepository) {
    companion object {
        const val DEFAULT_LIMIT = 20
        const val MAX_LIMIT = 100
    }

    operator fun invoke(requestedLimit: Int?): List<Recipe> {
        val limit = (requestedLimit ?: DEFAULT_LIMIT).coerceIn(1, MAX_LIMIT)
        return repository.list(limit)
    }
}

/** Fetch one recipe; null means "not found" and the interface maps it to 404. */
class GetRecipeUseCase(private val repository: RecipeRepository) {
    operator fun invoke(id: UUID): Recipe? = repository.findById(id)
}

/** Create: normalize + validate input, mint identity, persist. */
class CreateRecipeUseCase(private val repository: RecipeRepository) {
    operator fun invoke(title: String, cuisine: String?): Recipe {
        val normalized = Recipe.normalizeTitle(title)
        require(normalized.isNotBlank()) { "title must not be blank" }
        val recipe = Recipe(
            id = UUID.randomUUID(),
            title = normalized,
            cuisine = cuisine?.trim()?.ifBlank { null },
            createdAt = LocalDateTime.now(),
        )
        return repository.save(recipe)
    }
}

/** Update: load, apply changes, save. Null means the id did not exist. */
class UpdateRecipeUseCase(private val repository: RecipeRepository) {
    operator fun invoke(id: UUID, title: String, cuisine: String?): Recipe? {
        val existing = repository.findById(id) ?: return null
        val normalized = Recipe.normalizeTitle(title)
        require(normalized.isNotBlank()) { "title must not be blank" }
        return repository.save(
            existing.copy(
                title = normalized,
                cuisine = cuisine?.trim()?.ifBlank { null },
            ),
        )
    }
}

/** Delete: true if a row was removed, false if the id was unknown. */
class DeleteRecipeUseCase(private val repository: RecipeRepository) {
    operator fun invoke(id: UUID): Boolean = repository.delete(id)
}
