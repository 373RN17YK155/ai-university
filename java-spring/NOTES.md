# Notes

- **Public repo.** Never write the employer's name, internal hosts, corporate package/group ids or
  internal service names anywhere in this workspace. Describe the work service generically. The
  pre-commit hook blocks known patterns (`.sensitive-patterns`, gitignored), but don't rely on it.
- The user will be working with Java/Kotlin and Spring directly in the near future: practical,
  job-ready focus. Has never written Java.

## Patterns
Skill-heavy + hands-on. Trainers for syntax and recognition (Java↔Kotlin, annotations, reading stack
traces); a project (`projects/`) that rebuilds, in miniature, the shape of the work service so every
lesson unblocks a real step. No vault notes for this subject.

## The work service (sanitized shape — what lessons should converge on)
- Spring Boot 3.x, Java 17 + Kotlin 1.9 (~half each), Maven with a corporate parent POM, Checkstyle.
- REST: ~70 `@RestController`s, API-first: OpenAPI spec → openapi-generator.
- Microservices: calls ~5+ neighbour services via OpenFeign.
- Kafka: both consumes several topics and produces via `KafkaTemplate`, through an in-house wrapper lib.
- ~20 `@Scheduled` jobs: refreshing a PostgreSQL materialized view every 5 min, Prometheus health
  metrics, expiry checks, polling. No Spring Batch / Quartz.
- External HTTP integrations: currency rates APIs, a transactional email API, FTP (commons-net).
- Reports: JasperReports 6 + iText → PDF/XLS.
- Persistence: Spring Data JPA (Hibernate) + jOOQ on PostgreSQL, Liquibase migrations.
- Tests: Testcontainers (Postgres, Kafka), WireMock.
- Deploy: Docker image on amazoncorretto:17, Helm, GitLab CI (→ infra subject).

## Environment
- Machine has only JDK 8 (AdoptOpenJDK) as of 2026-11-02; no Maven. Lesson 0001 installs Corretto 17
  (matches the work image). Homebrew is available.

## Plan sketch (revise freely)
Java core (from the user's other language) → build & run (Maven) → Spring core (DI, beans, config,
profiles) → REST + OpenAPI-first → JPA/jOOQ/Liquibase → transactions → Feign → Kafka → scheduling &
metrics → testing (Testcontainers, WireMock). Kotlin woven in from early on: each Java idiom shown with
its Kotlin twin once the Java side is solid.
