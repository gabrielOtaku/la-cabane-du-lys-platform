package com.cabanedulys.api.services.admin;

import com.cabanedulys.api.dto.GuestDto;
import com.cabanedulys.api.dto.admin.GuestUpsertRequest;
import com.cabanedulys.api.exceptions.NotFoundException;
import com.cabanedulys.api.models.Guest;
import com.cabanedulys.api.repositories.EpisodeRepository;
import com.cabanedulys.api.repositories.GuestRepository;
import com.cabanedulys.api.services.GuestService;
import com.cabanedulys.api.util.SlugUtils;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

/** Gestion des invités (phase 7) : slug unique, caches publics invalidés, épisodes liés tenus à jour. */
@Service
public class AdminGuestService {

    private final GuestRepository guests;
    private final EpisodeRepository episodes;
    private final GuestService publicGuests;
    private final AdminEpisodeService adminEpisodes;
    private final AuditService audit;

    public AdminGuestService(GuestRepository guests, EpisodeRepository episodes, GuestService publicGuests,
                             AdminEpisodeService adminEpisodes, AuditService audit) {
        this.guests = guests;
        this.episodes = episodes;
        this.publicGuests = publicGuests;
        this.adminEpisodes = adminEpisodes;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<GuestDto> list() {
        return guests.findAll(Sort.by("name")).stream().map(GuestDto::from).toList();
    }

    @Transactional(readOnly = true)
    public GuestDto get(UUID id) {
        return GuestDto.from(find(id));
    }

    @Transactional
    public GuestDto create(GuestUpsertRequest r) {
        String base = StringUtils.hasText(r.slug()) ? SlugUtils.slugify(r.slug()) : SlugUtils.slugify(r.name());
        Guest g = Guest.builder().slug(SlugUtils.unique(base, guests::existsBySlug)).build();
        apply(g, r);
        guests.save(g);
        publicGuests.evictAll();
        audit.log("guest.create", "guest", g.getId(), g.getName());
        return GuestDto.from(g);
    }

    @Transactional
    public GuestDto update(UUID id, GuestUpsertRequest r) {
        Guest g = find(id);
        if (StringUtils.hasText(r.slug())) {
            String wanted = SlugUtils.slugify(r.slug());
            if (!wanted.equals(g.getSlug())) {
                if (guests.existsBySlugAndIdNot(wanted, id)) {
                    throw new IllegalStateException("Le slug « " + wanted + " » est déjà utilisé.");
                }
                g.setSlug(wanted);
            }
        }
        boolean renamed = !g.getName().equals(r.name().trim());
        apply(g, r);
        guests.save(g);
        if (renamed) adminEpisodes.refreshGuestNames(id);
        publicGuests.evictAll();
        audit.log("guest.update", "guest", id, g.getName());
        return GuestDto.from(g);
    }

    @Transactional
    public void delete(UUID id) {
        Guest g = find(id);
        long linked = episodes.findAllByGuests_Id(id).size();
        if (linked > 0) {
            throw new IllegalStateException("Cet invité est lié à " + linked + " épisode(s). Retirez-le des épisodes avant de le supprimer.");
        }
        guests.delete(g);
        publicGuests.evictAll();
        audit.log("guest.delete", "guest", id, g.getName());
    }

    private Guest find(UUID id) {
        return guests.findById(id).orElseThrow(() -> new NotFoundException("Invité introuvable : " + id));
    }

    private static void apply(Guest g, GuestUpsertRequest r) {
        g.setName(r.name().trim());
        g.setRole(blankToNull(r.role()));
        g.setCompany(blankToNull(r.company()));
        g.setCompanyUrl(blankToNull(r.companyUrl()));
        g.setCity(blankToNull(r.city()));
        g.setRegion(blankToNull(r.region()));
        g.setCategory(blankToNull(r.category()));
        g.setAngle(blankToNull(r.angle()));
        g.setBio(blankToNull(r.bio()));
        g.setPhotoUrl(blankToNull(r.photoUrl()));
        g.setQuote(blankToNull(r.quote()));
        g.setFeatured(r.featured());
    }

    private static String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }
}
