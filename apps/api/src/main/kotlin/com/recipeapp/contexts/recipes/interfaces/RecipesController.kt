package com.recipeapp.contexts.recipes.interfaces

import com.recipeapp.contexts.recipes.application.CreateRecipeUseCase
import com.recipeapp.contexts.recipes.application.DeleteRecipeUseCase
import com.recipeapp.contexts.recipes.application.GetRecipeUseCase
import com.recipeapp.contexts.recipes.application.ListRecipesUseCase
import com.recipeapp.contexts.recipes.application.UpdateRecipeUseCase
import com.recipeapp.contexts.recipes.infrastructure.ExposedRecipeRepository
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import java.util.UUID

/**
 * CONTROLLER — thin handler functions (Ktor has no Controller class; a
 * top-level function taking ApplicationCall is idiomatic). Each one: parse the
 * request, call a use case, map to a DTO, respond. No SQL, no business rules -
 * that discipline is what keeps Laravel's "fat controller" trap out.
 */

/** GET /api/v1/recipes?limit=N */
suspend fun listRecipes(call: ApplicationCall) {
    val limit = call.request.queryParameters["limit"]?.toIntOrNull()
    val result = runCatching { ListRecipesUseCase(ExposedRecipeRepository()).invoke(limit).map { it.toSummary() } }
    result.fold(
        onSuccess = { call.respond(it) },
        onFailure = { dbUnavailable(call, it) },
    )
}

/** GET /api/v1/recipes/{id} */
suspend fun getRecipe(call: ApplicationCall) {
    val id = call.parseId() ?: return call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid-id"))
    val result = runCatching { GetRecipeUseCase(ExposedRecipeRepository()).invoke(id) }
    result.fold(
        onSuccess = { recipe ->
            if (recipe == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "not-found"))
            } else {
                call.respond(recipe.toDetail())
            }
        },
        onFailure = { dbUnavailable(call, it) },
    )
}

/** POST /api/v1/recipes */
suspend fun createRecipe(call: ApplicationCall) {
    val body = runCatching { call.receive<CreateRecipeRequest>() }.getOrNull()
        ?: return call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid-body"))
    try {
        val recipe = CreateRecipeUseCase(ExposedRecipeRepository()).invoke(body.title, body.cuisine)
        call.respond(HttpStatusCode.Created, recipe.toDetail())
    } catch (e: IllegalArgumentException) {
        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "validation", "message" to (e.message ?: "invalid")))
    } catch (e: Exception) {
        dbUnavailable(call, e)
    }
}

/** PUT /api/v1/recipes/{id} */
suspend fun updateRecipe(call: ApplicationCall) {
    val id = call.parseId() ?: return call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid-id"))
    val body = runCatching { call.receive<UpdateRecipeRequest>() }.getOrNull()
        ?: return call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid-body"))
    try {
        val recipe = UpdateRecipeUseCase(ExposedRecipeRepository()).invoke(id, body.title, body.cuisine)
        if (recipe == null) {
            call.respond(HttpStatusCode.NotFound, mapOf("error" to "not-found"))
        } else {
            call.respond(recipe.toDetail())
        }
    } catch (e: IllegalArgumentException) {
        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "validation", "message" to (e.message ?: "invalid")))
    } catch (e: Exception) {
        dbUnavailable(call, e)
    }
}

/** DELETE /api/v1/recipes/{id} */
suspend fun deleteRecipe(call: ApplicationCall) {
    val id = call.parseId() ?: return call.respond(HttpStatusCode.BadRequest, mapOf("error" to "invalid-id"))
    val result = runCatching { DeleteRecipeUseCase(ExposedRecipeRepository()).invoke(id) }
    result.fold(
        onSuccess = { deleted ->
            if (deleted) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "not-found"))
            }
        },
        onFailure = { dbUnavailable(call, it) },
    )
}

// ── helpers ─────────────────────────────────────────────────────────────────

/** Reads the {id} path segment as a UUID, or null when absent/malformed. */
private fun ApplicationCall.parseId(): UUID? =
    parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }

/** Any repository/connection failure means Postgres is unreachable: log detail, respond 503. */
private suspend fun dbUnavailable(call: ApplicationCall, cause: Throwable) {
    call.application.environment.log.warn("Recipe endpoint degraded (database unavailable): ${cause.message}")
    call.respond(HttpStatusCode.ServiceUnavailable, mapOf("error" to "database-unavailable"))
}
