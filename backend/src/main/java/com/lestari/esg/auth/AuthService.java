package com.lestari.esg.auth;

import com.lestari.esg.auth.dto.AcceptInviteRequest;
import com.lestari.esg.auth.dto.AuthResponse;
import com.lestari.esg.auth.dto.InvitePreviewResponse;
import com.lestari.esg.auth.dto.LoginRequest;
import com.lestari.esg.auth.dto.MeResponse;
import com.lestari.esg.auth.dto.OnboardingRequest;
import com.lestari.esg.auth.dto.RegisterRequest;
import com.lestari.esg.auth.dto.UpdateProfileRequest;
import com.lestari.esg.common.exceptions.ConflictException;
import com.lestari.esg.common.exceptions.NotFoundException;
import com.lestari.esg.security.CurrentUserProvider;
import com.lestari.esg.security.JwtService;
import com.lestari.esg.tenant.Company;
import com.lestari.esg.tenant.CompanyRepository;
import com.lestari.esg.tenant.MarketClassification;
import com.lestari.esg.tenant.Sector;
import com.lestari.esg.tenant.SectorRepository;
import com.lestari.esg.tenant.SubscriptionPlan;
import com.lestari.esg.tenant.TeamInvite;
import com.lestari.esg.tenant.TeamInviteRepository;
import com.lestari.esg.user.AppUser;
import com.lestari.esg.user.AppUserRepository;
import com.lestari.esg.user.Role;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final CompanyRepository companyRepository;
    private final SectorRepository sectorRepository;
    private final TeamInviteRepository teamInviteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUserProvider currentUserProvider;

    public AuthService(AppUserRepository appUserRepository,
                        CompanyRepository companyRepository,
                        SectorRepository sectorRepository,
                        TeamInviteRepository teamInviteRepository,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService,
                        CurrentUserProvider currentUserProvider) {
        this.appUserRepository = appUserRepository;
        this.companyRepository = companyRepository;
        this.sectorRepository = sectorRepository;
        this.teamInviteRepository = teamInviteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }

        Company company = new Company();
        company.setName(request.companyName());
        company.setMarketClassification(MarketClassification.SME);
        company.setSubscriptionPlan(SubscriptionPlan.STARTER);
        company.setOnboardingCompleted(false);
        company = companyRepository.save(company);

        AppUser user = new AppUser();
        user.setCompany(company);
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setName(request.name());
        user.setRole(Role.COMPANY_ADMIN);
        user = appUserRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toMeResponse(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!Boolean.TRUE.equals(user.getActive()) || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toMeResponse(user));
    }

    @Transactional(readOnly = true)
    public InvitePreviewResponse previewInvite(String token) {
        TeamInvite invite = requireValidInvite(token);
        Company company = companyRepository.findById(invite.getCompanyId())
                .orElseThrow(() -> new NotFoundException("Company not found"));
        return new InvitePreviewResponse(company.getName(), invite.getName(), invite.getEmail(), invite.getRole(), invite.getInvitedByName());
    }

    @Transactional
    public AuthResponse acceptInvite(String token, AcceptInviteRequest request) {
        TeamInvite invite = requireValidInvite(token);
        if (appUserRepository.existsByEmailIgnoreCase(invite.getEmail())) {
            throw new ConflictException("An account with this email already exists");
        }
        Company company = companyRepository.findById(invite.getCompanyId())
                .orElseThrow(() -> new NotFoundException("Company not found"));

        AppUser user = new AppUser();
        user.setCompany(company);
        user.setEmail(invite.getEmail());
        user.setName(request.name());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(invite.getRole());
        user = appUserRepository.save(user);

        invite.setAcceptedAt(Instant.now());
        teamInviteRepository.save(invite);

        String jwt = jwtService.generateToken(user);
        return new AuthResponse(jwt, toMeResponse(user));
    }

    private TeamInvite requireValidInvite(String token) {
        TeamInvite invite = teamInviteRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Invite not found"));
        if (invite.getRevokedAt() != null) {
            throw new ConflictException("This invite has been revoked");
        }
        if (invite.getAcceptedAt() != null) {
            throw new ConflictException("This invite has already been accepted");
        }
        if (invite.getExpiresAt().isBefore(Instant.now())) {
            throw new ConflictException("This invite has expired — ask an admin to resend it");
        }
        return invite;
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        AppUser user = appUserRepository.findById(currentUserProvider.getPrincipal().userId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        return toMeResponse(user);
    }

    @Transactional
    public MeResponse updateProfile(UpdateProfileRequest request) {
        AppUser user = appUserRepository.findById(currentUserProvider.getPrincipal().userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(request.email()) && appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }

        user.setName(request.name());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setDateOfBirth(request.dateOfBirth());
        user.setAddress(request.address());
        user.setBio(request.bio());
        user = appUserRepository.save(user);

        return toMeResponse(user);
    }

    @Transactional
    public MeResponse completeOnboarding(OnboardingRequest request) {
        AppUser user = appUserRepository.findById(currentUserProvider.getPrincipal().userId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        Company company = user.getCompany();
        if (company == null) {
            throw new NotFoundException("No company associated with current user");
        }

        company.setMarketClassification(request.market());
        company.setSubscriptionPlan(planForMarket(request.market()));
        company.setOnboardingCompleted(true);
        company.setFrameworks(request.frameworks() != null ? request.frameworks() : java.util.List.of());
        company.setPriorities(request.priorities() != null ? request.priorities() : java.util.List.of());

        if (request.sectorCode() != null && !request.sectorCode().isBlank()) {
            Sector sector = sectorRepository.findById(request.sectorCode())
                    .orElseThrow(() -> new NotFoundException("Unknown sector code: " + request.sectorCode()));
            company.setSector(sector);
        }

        companyRepository.save(company);
        return toMeResponse(user);
    }

    private SubscriptionPlan planForMarket(MarketClassification market) {
        return switch (market) {
            case SME -> SubscriptionPlan.STARTER;
            case ACE_MARKET -> SubscriptionPlan.GROWTH;
            case MAIN_MARKET -> SubscriptionPlan.ISSUER_READY;
        };
    }

    MeResponse toMeResponse(AppUser user) {
        Company company = user.getCompany();
        return new MeResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                company != null ? company.getId() : null,
                company != null ? company.getName() : null,
                company != null && company.getSector() != null ? company.getSector().getCode() : null,
                company != null ? company.getMarketClassification() : null,
                company != null ? company.getSubscriptionPlan() : null,
                company != null && Boolean.TRUE.equals(company.getOnboardingCompleted()),
                company != null ? company.getFrameworks() : java.util.List.of(),
                company != null ? company.getPriorities() : java.util.List.of(),
                user.getPhone(),
                user.getDateOfBirth(),
                user.getAddress(),
                user.getBio(),
                user.getAvatarPath() != null
        );
    }
}
