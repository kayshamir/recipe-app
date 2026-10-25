package com.recipeapp.contexts.recipes.domain

import java.time.LocalDateTime
import java.util.UUID

/**
 * Domain model — pure Kotlin, no Ktor, no Exposed, no kotlinx.serialization.
 * Laravel has no real equivalent for this layer; the closest is business code
 * you'd resist putting in an Eloquent model and wish lived somewhere testable.
 * Everything here can be unit-tested without a database or an HTTP server.
 */
data class Recipe(
    val id: UUID,
    val title: String,
    val cuisine: String?,
    val createdAt: LocalDateTime,
) {
    init {
        require(title.isNotBlank()) { "Recipe title must not be blank" }
    }

    companion object {
        /** Normalizes raw input the way a casting/mutator would in Laravel. */
        fun normalizeTitle(raw: String): String =
            raw.trim().replace(Regex("\\s+"), " ")
    }
}
