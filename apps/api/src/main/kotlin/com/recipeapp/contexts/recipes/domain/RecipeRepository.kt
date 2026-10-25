package com.recipeapp.contexts.recipes.domain

import java.util.UUID

/**
 * Repository PORT — declared by the domain, implemented by infrastructure.
 * This inversion is DDD's core move; Laravel never asks you to write one
 * because Eloquent hard-codes the Model to the database. Here the domain says
 * "I need to fetch recipes" and stays ignorant of Postgres existing.
 *
 * Laravel's nearest analogue is binding an interface to an implementation in
 * the service container — except the dependency arrow here points the right
 * way: infrastructure depends on domain, never the reverse.
 */
interface RecipeRepository {
    fun findById(id: UUID): Recipe?
    fun list(limit: Int): List<Recipe>

    /** Insert or update by id; returns the persisted recipe. */
    fun save(recipe: Recipe): Recipe

    /** Returns true when a row was removed, false when the id did not exist. */
    fun delete(id: UUID): Boolean
}
