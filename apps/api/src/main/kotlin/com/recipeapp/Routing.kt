package com.recipeapp

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import com.recipeapp.infrastructure.databaseIsHealthy
import com.recipeapp.contexts.recipes.interfaces.recipesRoutes

/**
 * Composition root — the routing equivalent of Laravel's routes/api.php.
 * It mounts route graphs declared inside each bounded context; handlers and
 * SQL never live here.
 */
fun Application.configureRouting() {
    routing {
        get("/") {
            call.respondText("Hello, Wssorldhahaha!")
        }
        // Polled by monitoring per ARCHITECTURE.md § 10; 503 when the DB is down.
        get("/healthz") {
            if (databaseIsHealthy()) {
                call.respond(mapOf("status" to "ok"))
            } else {
                call.respond(HttpStatusCode.ServiceUnavailable, mapOf("status" to "database-unavailable"))
            }
        }
        route("/api/v1") {
            recipesRoutes()
        }
    }
}
