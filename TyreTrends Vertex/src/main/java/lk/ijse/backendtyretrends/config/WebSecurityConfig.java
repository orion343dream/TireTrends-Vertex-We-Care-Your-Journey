package lk.ijse.backendtyretrends.config;

import lk.ijse.backendtyretrends.service.Impl.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@EnableWebSecurity
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtFilter jwtFilter;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(authService).passwordEncoder(passwordEncoder);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

  @Bean
  protected SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
      return http
              .csrf(AbstractHttpConfigurer::disable)
              .cors(cors -> cors.configurationSource(corsConfigurationSource()))  // Add this line
              .authorizeHttpRequests(auth -> auth
                      .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()  // Add this line
                      .requestMatchers(
                              "/api/v1/auth/authenticate",
                              "/api/v1/auth/logout",
                              "/api/v1/user/register",
                              "/v3/api-docs/**",
                              "/swagger-ui/**",
                              "/swagger-ui.html",
//                              "/api/v1/products/**",  // Allow product browsing without login
                              "/api/v1/brands/**",    // Allow brand listing without login
                              "/api/v1/categories/**", // Allow category listing without login
                              "/api/v1/products/**",        // Allow access to products
                              "/api/v1/reviews/product/**", // Allow access to product reviews
                              "/api/v1/reviews/checkout/**",
                              "/api/v1/reviews/order/**",
                              "/api/v1/vehicles/**",


                              "/api/v1/user/profile"
                      ).permitAll()
                      .requestMatchers("/api/v1/categories/**").hasAuthority("ADMIN") // Add this line
                      .requestMatchers("/api/v1/brands/**").hasAuthority("ADMIN") // Add this line
                      .requestMatchers("/api/v1/admin/**").hasAuthority("ADMIN")
                      .requestMatchers("/api/v1/user/**").hasAuthority("USER")
                      .anyRequest().authenticated()
              )
              .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
              .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
              .build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
      CorsConfiguration configuration = new CorsConfiguration();
      configuration.setAllowedOrigins(Arrays.asList("http://localhost:63342"));
      configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
      configuration.setAllowedHeaders(Arrays.asList(
          "Authorization",
          "Content-Type",
          "Accept",
          "Origin",
          "Access-Control-Request-Method",
          "Access-Control-Request-Headers"
      ));
      configuration.setExposedHeaders(Arrays.asList("Authorization"));
      configuration.setAllowCredentials(true);
      configuration.setMaxAge(3600L);

      UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
      source.registerCorsConfiguration("/**", configuration);
      return source;
  }
}