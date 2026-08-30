package com.esgeasy.esg.report;

import com.esgeasy.esg.common.TenantOwnedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Free-text narrative content (CEO statement, company overview, etc.) that feeds the ESG Disclosure
 *  Summary Report — one row per company, same "settings" shape as {@link com.esgeasy.esg.email.CompanyEmailSettings}. */
@Entity
@Table(name = "report_narrative")
@Getter
@Setter
@NoArgsConstructor
public class ReportNarrative extends TenantOwnedEntity {

    @Column(name = "ceo_statement", columnDefinition = "TEXT")
    private String ceoStatement;

    @Column(name = "report_scope_description", columnDefinition = "TEXT")
    private String reportScopeDescription;

    @Column(name = "company_overview", columnDefinition = "TEXT")
    private String companyOverview;

    @Column(name = "esg_strategy_narrative", columnDefinition = "TEXT")
    private String esgStrategyNarrative;

    @Column(name = "sustainability_email", length = 255)
    private String sustainabilityEmail;

    @Column(name = "investor_relations_email", length = 255)
    private String investorRelationsEmail;
}
