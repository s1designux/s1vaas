package kr.s1.vaas.web;

import kr.s1.vaas.domain.Contract;
import kr.s1.vaas.infra.ContractRepository;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {

    private final ContractRepository repo;

    public ContractController(ContractRepository repo) {
        this.repo = repo;
    }

    public record ContractDto(
            UUID id,
            String code,
            String name,
            String companyId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        static ContractDto from(Contract c) {
            return new ContractDto(c.getId(), c.getCode(), c.getName(),
                    c.getCompanyId(), c.getStartDate(), c.getEndDate());
        }
    }

    @GetMapping
    public List<ContractDto> list() {
        return repo.findAll().stream().map(ContractDto::from).toList();
    }

    @GetMapping("/{id}")
    public ContractDto get(@PathVariable UUID id) {
        return repo.findById(id).map(ContractDto::from)
                .orElseThrow(() -> new RuntimeException("contract not found: " + id));
    }

    @GetMapping("/by-code/{code}")
    public ContractDto byCode(@PathVariable String code) {
        return repo.findByCode(code).map(ContractDto::from)
                .orElseThrow(() -> new RuntimeException("contract not found: " + code));
    }
}
