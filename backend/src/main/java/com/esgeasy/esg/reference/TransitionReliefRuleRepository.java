package com.lestari.esg.reference;

import org.springframework.data.jpa.repository.JpaRepository;
import com.lestari.esg.tenant.MarketClassification;

public interface TransitionReliefRuleRepository extends JpaRepository<TransitionReliefRule, MarketClassification> {
}
