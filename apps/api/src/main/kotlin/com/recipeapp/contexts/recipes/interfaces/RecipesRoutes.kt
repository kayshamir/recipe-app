package com.recipeapp.contexts.recipes.interfaces

import io.ktor.server.routing.*

/**
 * This context's slice of routes/api.php. The composition root mounts it with
 * `route("/api/v1") { recipesRoutes() }`. Keeping path declarations here means
 * a context's full URL surface is readable from one file, and deleting the
 * context folder removes exactly one mount line from Routing.kt.
 */
fun Route.recipesRoutes() {
    route("/recipes") {
        get { listRecipes(call) }
        post { createRecipe(call) }
        route("/{id}") {
            get { getRecipe(call) }
            put { updateRecipe(call) }
            delete { deleteRecipe(call) }
        }
    }
}
