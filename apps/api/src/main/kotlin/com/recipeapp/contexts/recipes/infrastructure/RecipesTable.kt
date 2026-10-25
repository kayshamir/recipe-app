package com.recipeapp.contexts.recipes.infrastructure

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.java.javaUUID
import org.jetbrains.exposed.v1.javatime.datetime

/**
 * Exposed table — the type-safe MIRROR of the `recipes` migration. It describes
 * shape only; it never touches the database and never creates schema.
 *
 * Division of labor (project convention): Flyway owns DDL (the real
 * `CREATE TABLE` in db/migration/), this object owns typed queries. If they
 * drift, queries fail loudly — unlike Eloquent, which infers columns at runtime.
 */
object RecipesTable : Table("recipes") {
    val id = javaUUID("id")
    val title = varchar("title", 300)
    val cuisine = varchar("cuisine", 100).nullable()
    val sourceUrl = varchar("source_url", 1000).nullable()
    val createdAt = datetime("created_at")

    override val primaryKey = PrimaryKey(id)
}
