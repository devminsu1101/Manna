# Manna 백엔드 컨테이너.
#
# Railway는 이 파일이 있으면 자동 감지(Railpack, 예전 Nixpacks) 대신 이것을 쓴다.
# 서비스 Root Directory가 `apps/backend`여야 이 파일을 찾는다(모노레포).
# Docker로 가는 이유: 자동 감지의 Gradle 기본 빌드는 `./gradlew build`라 **테스트까지 돈다**. 그 테스트는
# 스프링 컨텍스트를 띄우므로 DB와 Google 시크릿이 있어야 하고, 빌드 서버에는 둘 다 없다.
# 여기서 무엇을 어떻게 빌드할지 직접 적어 그 함정을 피한다. 덤으로 플랫폼을 옮겨도 그대로 쓴다.

FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
# bootJar만 만든다(-x test). 테스트는 CI에서 DB를 붙여 돌릴 자리다.
RUN ./gradlew --no-daemon bootJar -x test

FROM eclipse-temurin:17-jre
WORKDIR /app
# bootJar 하나만 만들었으므로 와일드카드가 한 파일에만 맞는다(`build`였다면 -plain.jar이 함께 나온다).
COPY --from=build /app/build/libs/*.jar app.jar

# Railway가 주입하는 PORT를 application.properties의 server.port가 읽는다. 여기 값은 로컬 기본값.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
