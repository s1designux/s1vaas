package kr.s1.vaas.infra;

import kr.s1.vaas.domain.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {
    Optional<Contract> findByCode(String code);
}
