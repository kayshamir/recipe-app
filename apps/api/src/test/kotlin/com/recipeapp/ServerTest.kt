package com.recipeapp

import com.recipeapp.infrastructure.configureSerialization
import com.recipeapp.infrastructure.configureStatusPages
import io.ktor.client.request.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals

class ServerTest {

    @Test
    fun `root responds and health degrades without a database`() = testApplication {
        // Build the app explicitly from the composition-root modules rather than
        // relying on config auto-discovery of module names.
        //
        // configureDatabase() is deliberately NOT called: with no connection made,
        // databaseIsHealthy() is false and /healthz must report 503 rather than
        // crash. Keeping DB init out of the test makes it hermetic - it no longer
        // passes/fails depending on whether a local Postgres happens to be up.
        application {
            configureSerialization()
            configureStatusPages()
            configureRouting()
        }
        assertEquals(HttpStatusCode.OK, client.get("/").status)
        // No database connected, so /healthz must report 503, not crash.
        assertEquals(HttpStatusCode.ServiceUnavailable, client.get("/healthz").status)
    }
}
