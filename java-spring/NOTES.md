# Notes

- **Public repo.** Never write the employer's name, internal hosts, corporate package/group ids or
  internal service names anywhere in this workspace. Describe the work service generically. The
  pre-commit hook blocks known patterns (`.sensitive-patterns`, gitignored), but don't rely on it.
- The user will be working with Java/Kotlin and Spring directly in the near future: practical,
  job-ready focus. Has never written Java. Writes TypeScript: explain Java/Kotlin by contrast
  with TS (structural vs nominal typing, erased vs reified-ish generics, null handling, async model).

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
metrics → testing (Testcontainers, WireMock). Kotlin from lesson 3 on (decided 2026-11-02: user knows TS, so
Kotlin syntax is cheap; Java stays the base because Spring and its errors read through Java): each
idiom shown in Java, then its Kotlin twin.

Budget: 4–6 h/week, ~20–45 h before start: not enough for all 8 success items at depth. Priority if
time runs short: (1) read the service end-to-end, (2) endpoint via OpenAPI → controller → service →
repo, (3) JPA + Liquibase, (4) tests with Testcontainers; then Feign, Kafka, @Scheduled/metrics.
Lessons sized for ~30–45 min each, ~6–8 per week max.
