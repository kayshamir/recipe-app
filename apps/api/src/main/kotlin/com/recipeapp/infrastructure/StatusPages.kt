package com.recipeapp.infrastructure

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import kotlinx.serialization.Serializable

/** Standard error envelope — the shape mobile can rely on for every failure. */
@Serializable
data class ApiError(val error: String, val message: String? = null)

fun Application.configureStatusPages() {
    install(StatusPages) {
        status(HttpStatusCode.NotFound) { call, _ ->
            call.respond(HttpStatusCode.NotFound, ApiError(error = "not-found"))
        }
        exception<Throwable> { call, cause ->
            // Laravel's Handler.php equivalent: log the detail, never leak it in the body.
            call.application.environment.log.error("Unhandled exception", cause)
            call.respond(HttpStatusCode.InternalServerError, ApiError(error = "internal", message = "unexpected-error"))
        }
    }
}
