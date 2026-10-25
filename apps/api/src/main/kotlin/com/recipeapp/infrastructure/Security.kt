package com.recipeapp.infrastructure

import io.ktor.server.application.*
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

/**
 * JWT guard configuration (ARCHITECTURE.md § 2 Auth row). Laravel analogy:
 * config/auth.php guard + Sanctum bootstrap — routes opt in with
 * `authenticate { ... }`, they don't check tokens by hand.
 */
fun Application.configureSecurity() {
    val jwtAudience = "kuery-api"
    val jwtRealm = "kuery"
    // Dev fallback only; production must set JWT_SECRET (never committed, § 10).
    val jwtSecret = System.getenv("JWT_SECRET") ?: "dev-only-insecure-secret"
    authentication {
        jwt {
            realm = jwtRealm
            verifier(
                JWT
                    .require(Algorithm.HMAC256(jwtSecret))
                    .withAudience(jwtAudience)
                    .build()
            )
            validate { credential ->
                if (credential.payload.audience.contains(jwtAudience)) JWTPrincipal(credential.payload) else null
            }
        }
    }
}
