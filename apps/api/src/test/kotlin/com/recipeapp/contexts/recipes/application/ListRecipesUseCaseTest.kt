package com.recipeapp.contexts.recipes.application

import com.recipeapp.contexts.recipes.domain.Recipe
import com.recipeapp.contexts.recipes.domain.RecipeRepository
import java.time.LocalDateTime
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * The DDD dividend made visible: because every use case depends only on the
 * RecipeRepository PORT, we can test the real create/read/update/delete logic
 * with a 15-line in-memory fake - no database, no HTTP server, no Testcontainers.
 * In Laravel you'd typically need RefreshDatabase or a mocked DB facade here.
 */
class RecipeUseCasesTest {

    private class FakeRepository(seed: List<Recipe> = emptyList()) : RecipeRepository {
        private val store = linkedMapOf<String, Recipe>()
        var lastLimit: Int? = null

        init {
            seed.forEach { store[it.id.toString()] = it }
        }

        override fun findById(id: UUID): Recipe? = store[id.toString()]

        override fun list(limit: Int): List<Recipe> {
            lastLimit = limit
            return store.values.take(limit)
        }

        override fun save(recipe: Recipe): Recipe {
            store[recipe.id.toString()] = recipe
            return recipe
        }

        override fun delete(id: UUID): Boolean = store.remove(id.toString()) != null
    }

    private fun recipe(title: String) =
        Recipe(UUID.randomUUID(), title, "Filipino", LocalDateTime.now())

    @Test
    fun `list applies default limit when none requested`() {
        val repo = FakeRepository(List(5) { recipe("R$it") })
        ListRecipesUseCase(repo).invoke(null)
        assertEquals(ListRecipesUseCase.DEFAULT_LIMIT, repo.lastLimit)
    }

    @Test
    fun `list clamps oversized limit to the maximum`() {
        val repo = FakeRepository(emptyList())
        ListRecipesUseCase(repo).invoke(9999)
        assertEquals(ListRecipesUseCase.MAX_LIMIT, repo.lastLimit)
    }

    @Test
    fun `create normalizes title and persists`() {
        val repo = FakeRepository()
        val created = CreateRecipeUseCase(repo).invoke("  Sinigang   na   Bayot  ", "  ")
        assertEquals("Sinigang na Bayot", created.title)
        assertNull(created.cuisine) // blank cuisine collapses to null
        assertNotNull(repo.findById(created.id))
    }

    @Test
    fun `create rejects blank title`() {
        val repo = FakeRepository()
        assertFailsWith<IllegalArgumentException> {
            CreateRecipeUseCase(repo).invoke("   ", null)
        }
    }

    @Test
    fun `get returns null for unknown id`() {
        val repo = FakeRepository()
        assertNull(GetRecipeUseCase(repo).invoke(UUID.randomUUID()))
    }

    @Test
    fun `update changes fields and keeps identity and timestamp`() {
        val repo = FakeRepository(listOf(recipe("Adobo")))
        val original = repo.list(10).first()
        val updated = UpdateRecipeUseCase(repo).invoke(original.id, "Chicken Adobo", "Ilocano")
        assertNotNull(updated)
        assertEquals(original.id, updated.id)
        assertEquals(original.createdAt, updated.createdAt)
        assertEquals("Chicken Adobo", updated.title)
        assertEquals("Ilocano", updated.cuisine)
    }

    @Test
    fun `update returns null when id is unknown`() {
        val repo = FakeRepository()
        assertNull(UpdateRecipeUseCase(repo).invoke(UUID.randomUUID(), "X", null))
    }

    @Test
    fun `delete removes and reports whether a row existed`() {
        val repo = FakeRepository(listOf(recipe("Kare-Kare")))
        val existing = repo.list(10).first()
        assertTrue(DeleteRecipeUseCase(repo).invoke(existing.id))
        assertNull(repo.findById(existing.id))
        assertTrue(!DeleteRecipeUseCase(repo).invoke(existing.id))
    }
}
