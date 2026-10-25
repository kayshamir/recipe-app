package com.recipeapp.contexts.recipes.interfaces

import com.recipeapp.contexts.recipes.domain.Recipe
import kotlinx.serialization.Serializable

/**
 * Outbound DTO — the API Resource / JsonSerializable equivalent. The wire
 * shape is deliberately separate from the domain Recipe so internal model
 * changes never silently break the mobile contract (ARCHITECTURE.md § 11).
 */
@Serializable
data class RecipeSummary(
    val id: String,
    val title: String,
    val cuisine: String?,
)

fun Recipe.toSummary() = RecipeSummary(
    id = id.toString(),
    title = title,
    cuisine = cuisine,
)

/** Full representation for single-resource reads and write acknowledgements. */
@Serializable
data class RecipeDetail(
    val id: String,
    val title: String,
    val cuisine: String?,
    val createdAt: String,
)

fun Recipe.toDetail() = RecipeDetail(
    id = id.toString(),
    title = title,
    cuisine = cuisine,
    createdAt = createdAt.toString(),
)

/** Inbound bodies - the Form Request equivalent (validation happens in the use case). */
@Serializable
data class CreateRecipeRequest(
    val title: String,
    val cuisine: String? = null,
)

@Serializable
data class UpdateRecipeRequest(
    val title: String,
    val cuisine: String? = null,
)
