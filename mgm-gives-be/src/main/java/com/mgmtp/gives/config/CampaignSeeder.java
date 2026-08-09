package com.mgmtp.gives.config;

import com.mgmtp.gives.entity.Campaign;
import com.mgmtp.gives.entity.CampaignMedia;
import com.mgmtp.gives.entity.Category;
import com.mgmtp.gives.entity.User;
import com.mgmtp.gives.enums.CampaignPriority;
import com.mgmtp.gives.enums.CampaignStatus;
import com.mgmtp.gives.enums.DonationMethod;
import com.mgmtp.gives.enums.MediaContext;
import com.mgmtp.gives.repository.CampaignRepository;
import com.mgmtp.gives.repository.CategoryRepository;
import com.mgmtp.gives.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class CampaignSeeder implements CommandLineRunner {

    private final CampaignRepository campaignRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        User creator = userRepository.findAll().stream()
                .findFirst()
                .orElse(null);

        if (creator == null) {
            log.warn("No users found to set as campaign creator. Skipping campaign seed.");
            return;
        }

        log.info("Checking and seeding missing charity campaigns with cover images...");

        // Seed categories
        Category disasterRelief = getOrCreateCategory("Disaster Relief", "Emergency response and recovery support for natural disasters.");
        Category education = getOrCreateCategory("Education", "Providing books, scholarships, and resources to children in need.");
        Category healthcare = getOrCreateCategory("Healthcare", "Medical aid, supplies, and services for underprivileged communities.");
        Category animalRescue = getOrCreateCategory("Animal Rescue & Shelter", "Dedicated to animal rescue operations, shelters, and veterinary care.");
        Category communityDev = getOrCreateCategory("Community Development", "Support local infrastructure, public facilities, and community-driven initiatives.");
        Category environment = getOrCreateCategory("Environmental Conservation", "Projects dedicated to preserving ecosystems, forestry, clean energy.");
        Category elderlyCare = getOrCreateCategory("Elderly Care", "Support for aging individuals, including care homes and medical aid.");
        Category disabilitySupport = getOrCreateCategory("Disability Support", "Assistive devices and specialized care for people with disabilities.");

        LocalDateTime now = LocalDateTime.now();
        List<Campaign> campaignsToSave = new ArrayList<>();

        // 1. MGM Books & Warmth
        buildCampaignIfNotExists(campaignsToSave, creator, "MGM Books & Warmth 2026",
                "Providing school supplies, textbooks, and warm winter coats to over 300 primary school children in Yen Bai province before the cold season arrives.",
                CampaignStatus.APPROVED, CampaignPriority.URGENT, 150_000_000L, now.minusDays(5), now.plusDays(30),
                true, true, "Vietcombank", "VCB", "970436", "1029384756", "MGM GIVES CHARITY FUND",
                Set.of(education, disasterRelief),
                "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop");

        // 2. Clean Water Central Vietnam
        buildCampaignIfNotExists(campaignsToSave, creator, "Clean Water for Central Vietnam",
                "Installing industrial water filtration systems and digging deep wells for remote drought-stricken villages in Quang Tri and Thua Thien Hue.",
                CampaignStatus.APPROVED, CampaignPriority.HIGH, 280_000_000L, now.minusDays(10), now.plusDays(45),
                true, false, "MB Bank", "MB", "970422", "999988887777", "MGM GIVES CHARITY FUND",
                Set.of(disasterRelief, healthcare),
                "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop");

        // 3. Rebuilding Schools After Storm Yagi
        buildCampaignIfNotExists(campaignsToSave, creator, "Rebuilding Schools After Storm Yagi",
                "Reconstructing classrooms, replacing damaged desks, and securing safety embankments for two kindergarten centers severely damaged by recent floods.",
                CampaignStatus.APPROVED, CampaignPriority.URGENT, 350_000_000L, now.minusDays(2), now.plusDays(60),
                true, true, "Techcombank", "TCB", "970407", "1903456789", "MGM GIVES CHARITY FUND",
                Set.of(disasterRelief, communityDev, education),
                "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop");

        // 4. Plant 10,000 Trees
        buildCampaignIfNotExists(campaignsToSave, creator, "Mam Xanh Truong Son — Trong 10,000 Cay Xanh",
                "Du an hop tac cung kiem lam dia phuong trong 10,000 cay go ban dia tai khu vuc rung phong ho Truong Son, chong sat lo dat va cai tao he sinh thai.",
                CampaignStatus.APPROVED, CampaignPriority.HIGH, 200_000_000L, now.minusDays(8), now.plusDays(40),
                true, false, "Vietcombank", "VCB", "970436", "1029384756", "MGM GIVES CHARITY FUND",
                Set.of(environment, communityDev),
                "https://images.unsplash.com/photo-1511497584788-876761c11969?q=80&w=1200&auto=format&fit=crop");

        // 5. Solar Lights for Rural Roads
        buildCampaignIfNotExists(campaignsToSave, creator, "Anh Sang Duong Que — Thap Sang 20km Duong Ban",
                "Lap dat 500 bo den nang luong mat troi tu dong tren cac tuyen duong giao thong nong thon tai cac ban lang vung sau vung xa tinh Cao Bang.",
                CampaignStatus.APPROVED, CampaignPriority.NORMAL, 180_000_000L, now.minusDays(12), now.plusDays(25),
                true, true, "MB Bank", "MB", "970422", "999988887777", "MGM GIVES CHARITY FUND",
                Set.of(communityDev),
                "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=1200&auto=format&fit=crop");

        // 6. Kindergarten Renovation
        buildCampaignIfNotExists(campaignsToSave, creator, "Nha Cau Vong — Cai Tao Diem Truong Mam Non",
                "Son sua, xay moi khu ve sinh dat chuan, lam san choi an toan va trao tang do choi phat trien tri tue cho 120 be mam non tai xa ngheo Muong La, Son La.",
                CampaignStatus.APPROVED, CampaignPriority.HIGH, 220_000_000L, now.minusDays(3), now.plusDays(50),
                true, true, "Techcombank", "TCB", "970407", "1903456789", "MGM GIVES CHARITY FUND",
                Set.of(education, communityDev),
                "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop");

        // 7. Scholarships for Poor Students
        buildCampaignIfNotExists(campaignsToSave, creator, "Chap Canh Giac Mo — 50 Hoc Bong Cho Sinh Vien Ngheo",
                "Trao 50 suat hoc bong toan phan va tai tro may tinh xach tay cho cac ban tan sinh vien co ho an canh dac biet kho khan vuon len trong hoc tap.",
                CampaignStatus.APPROVED, CampaignPriority.NORMAL, 300_000_000L, now.minusDays(15), now.plusDays(35),
                true, true, "BIDV", "BIDV", "970418", "2151000123456", "MGM GIVES CHARITY FUND",
                Set.of(education),
                "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop");

        // 8. Mobile Medical Clinic
        buildCampaignIfNotExists(campaignsToSave, creator, "Y Te Den Ban — Kham Benh & Phat Thuoc Mien Phi",
                "Hanh trinh y khoa tinh nguyen mang theo doi ngu bac si chuyen khoa, may sieu am di dong va thuoc mien phi kham chua benh cho nguoi gia va tre em.",
                CampaignStatus.APPROVED, CampaignPriority.URGENT, 160_000_000L, now.minusDays(6), now.plusDays(20),
                true, true, "Vietcombank", "VCB", "970436", "1029384756", "MGM GIVES CHARITY FUND",
                Set.of(healthcare),
                "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=1200&auto=format&fit=crop");

        // 9. Elderly Care Support
        buildCampaignIfNotExists(campaignsToSave, creator, "Vong Tay Yeu Thuong — Cham Soc Cu Gia Don Than",
                "Gui trao ta lot, sua dinh duong, may do huyet ap va to chuc cac buoi giao luu van nghe, cham soc doi song tinh than cho 200 cu gia noi vien duong lao.",
                CampaignStatus.APPROVED, CampaignPriority.NORMAL, 90_000_000L, now.minusDays(20), now.plusDays(15),
                true, true, "MB Bank", "MB", "970422", "999988887777", "MGM GIVES CHARITY FUND",
                Set.of(elderlyCare, healthcare),
                "https://images.unsplash.com/photo-1581579438747-1dc8d1e05842?q=80&w=1200&auto=format&fit=crop");

        // 10. Smile Operation for Children
        buildCampaignIfNotExists(campaignsToSave, creator, "Nu Cuoi Cho Em — Phau Thuat Ho Ham Ech",
                "Tai tro toan bo chi phi phau thuat nu cuoi, di lai va phuc hoi chuc nang cho 30 em nho bi di tat bam sinh moi, ham ech tai cac tinh Tay Nguyen.",
                CampaignStatus.APPROVED, CampaignPriority.URGENT, 450_000_000L, now.minusDays(1), now.plusDays(90),
                true, false, "Vietcombank", "VCB", "970436", "1029384756", "MGM GIVES CHARITY FUND",
                Set.of(healthcare),
                "https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?q=80&w=1200&auto=format&fit=crop");

        // 11. Wheelchairs for Disabled People
        buildCampaignIfNotExists(campaignsToSave, creator, "Dong Hanh Cung Xe Lan — Trao 100 Xe Lan",
                "Trao tang 100 chiec xe lan da nang kien co va suat ho tro sinh ke ban dau cho nguoi khuyet tat co hoan canh kho khan giup ho tu tin hoa nhap cong dong.",
                CampaignStatus.APPROVED, CampaignPriority.NORMAL, 170_000_000L, now.minusDays(7), now.plusDays(30),
                true, true, "BIDV", "BIDV", "970418", "2151000123456", "MGM GIVES CHARITY FUND",
                Set.of(disabilitySupport),
                "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=1200&auto=format&fit=crop");

        // 12. Animal Rescue Shelter
        buildCampaignIfNotExists(campaignsToSave, creator, "Rescue Shelter & Veterinary Care Fund",
                "Providing medical treatment, food supplies, and shelter renovations for over 150 rescued animals currently cared for by local animal shelters.",
                CampaignStatus.APPROVED, CampaignPriority.NORMAL, 60_000_000L, now.minusDays(14), now.plusDays(10),
                true, true, "Techcombank", "TCB", "970407", "1903456789", "MGM GIVES CHARITY FUND",
                Set.of(animalRescue),
                "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=1200&auto=format&fit=crop");

        // 13. Completed Campaign: Mid-Autumn Festival
        buildCampaignIfNotExists(campaignsToSave, creator, "Mid-Autumn Festival Smiles 2025",
                "Delivered over 1,000 lantern gifts, mooncakes, and nutrition packages to pediatric patients across major central hospitals during Mid-Autumn Festival.",
                CampaignStatus.COMPLETED, CampaignPriority.NORMAL, 80_000_000L, now.minusDays(300), now.minusDays(270),
                true, true, "Vietcombank", "VCB", "970436", "1029384756", "MGM GIVES CHARITY FUND",
                Set.of(healthcare, education),
                "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=1200&auto=format&fit=crop");

        if (!campaignsToSave.isEmpty()) {
            campaignRepository.saveAll(campaignsToSave);
            log.info("Successfully seeded {} charity campaigns with cover images!", campaignsToSave.size());
        } else {
            log.info("All sample campaigns already exist. No seeding required.");
        }
    }

    /**
     * Only builds and queues a campaign for saving if a campaign with the given title does not yet exist.
     * IMPORTANT: For @OneToMany(orphanRemoval = true) collections, we MUST mutate the existing
     * collection (via .add()) rather than replacing the reference (via .setMedias()), otherwise
     * Hibernate throws: "A collection with orphan deletion was no longer referenced by the owning entity instance".
     */
    private void buildCampaignIfNotExists(List<Campaign> campaignsToSave, User creator, String title, String description,
                                          CampaignStatus status, CampaignPriority priority,
                                          Long target, LocalDateTime startDate, LocalDateTime endDate,
                                          boolean acceptsMoney, boolean acceptsGoods,
                                          String bankName, String bankCode, String bankBin,
                                          String accountNumber, String holderName,
                                          Set<Category> categories, String imageUrl) {
        if (campaignRepository.existsByTitle(title)) {
            return;
        }

        Campaign campaign = Campaign.builder()
                .title(title)
                .description(description)
                .user(creator)
                .status(status)
                .priority(priority)
                .target(target)
                .startDate(startDate)
                .endDate(endDate)
                .acceptsMoney(acceptsMoney)
                .acceptsGoods(acceptsGoods)
                .donationMethod(DonationMethod.MANUAL_QR)
                .bankName(bankName)
                .bankCode(bankCode)
                .bankBin(bankBin)
                .bankAccountNumber(accountNumber)
                .bankAccountHolderName(holderName)
                .categories(new HashSet<>(categories))
                .build();

        CampaignMedia coverImage = CampaignMedia.builder()
                .campaign(campaign)
                .url(imageUrl)
                .mediaType("IMAGE")
                .isCover(true)
                .context(MediaContext.CAMPAIGN)
                .build();

        // Mutate the existing HashSet initialised by @Builder.Default — never replace the reference
        campaign.getMedias().add(coverImage);

        campaignsToSave.add(campaign);
    }

    private Category getOrCreateCategory(String name, String description) {
        return categoryRepository.findAll().stream()
                .filter(cat -> cat.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(name)
                        .description(description)
                        .campaigns(new HashSet<>())
                        .build()));
    }
}
