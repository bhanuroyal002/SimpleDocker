FROM eclipse-temurin:17-jre

WORKDIR /app

COPY target/movie-ticket-booking.war app.war

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.war"]
