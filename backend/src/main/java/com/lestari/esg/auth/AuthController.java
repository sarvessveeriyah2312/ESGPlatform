package com.lestari.esg.auth;

import com.lestari.esg.auth.dto.AcceptInviteRequest;
import com.lestari.esg.auth.dto.AuthResponse;
import com.lestari.esg.auth.dto.InvitePreviewResponse;
import com.lestari.esg.auth.dto.LoginRequest;
import com.lestari.esg.auth.dto.MeResponse;
import com.lestari.esg.auth.dto.OnboardingRequest;
import com.lestari.esg.auth.dto.RegisterRequest;
import com.lestari.esg.auth.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLConnection;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final ProfileAvatarService profileAvatarService;

    public AuthController(AuthService authService, ProfileAvatarService profileAvatarService) {
        this.authService = authService;
        this.profileAvatarService = profileAvatarService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me() {
        return ResponseEntity.ok(authService.me());
    }

    @PatchMapping("/onboarding")
    public ResponseEntity<MeResponse> completeOnboarding(@Valid @RequestBody OnboardingRequest request) {
        return ResponseEntity.ok(authService.completeOnboarding(request));
    }

    @PatchMapping("/profile")
    public ResponseEntity<MeResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(request));
    }

    @PostMapping("/profile/avatar")
    public ResponseEntity<MeResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(profileAvatarService.uploadAvatar(file));
    }

    @GetMapping("/profile/avatar")
    public ResponseEntity<Resource> downloadAvatar() {
        ProfileAvatarService.StoredFile stored = profileAvatarService.downloadAvatar();
        Resource resource = new FileSystemResource(stored.path());
        String contentType = URLConnection.guessContentTypeFromName(stored.originalFileName());
        return ResponseEntity.ok()
                .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(resource);
    }

    @DeleteMapping("/profile/avatar")
    public ResponseEntity<MeResponse> removeAvatar() {
        return ResponseEntity.ok(profileAvatarService.removeAvatar());
    }

    @GetMapping("/invites/{token}")
    public ResponseEntity<InvitePreviewResponse> previewInvite(@PathVariable String token) {
        return ResponseEntity.ok(authService.previewInvite(token));
    }

    @PostMapping("/invites/{token}/accept")
    public ResponseEntity<AuthResponse> acceptInvite(@PathVariable String token, @Valid @RequestBody AcceptInviteRequest request) {
        return ResponseEntity.ok(authService.acceptInvite(token, request));
    }
}
