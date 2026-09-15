package com.cabanedulys.api.services.admin;

import com.cabanedulys.api.dto.admin.*;
import com.cabanedulys.api.exceptions.NotFoundException;
import com.cabanedulys.api.models.*;
import com.cabanedulys.api.repositories.*;
import com.cabanedulys.api.util.SlugUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Gestion de La Réserve (phase 7) : drops, pièces, stock et commandes.
 * Un drop ne passe en PUBLISHED qu'avec des dates cohérentes et au moins une pièce.
 */
@Service
public class AdminShopService {

    private final DropRepository drops;
    private final DropProductRepository dropProducts;
    private final ProductRepository products;
    private final StockReservationRepository reservations;
    private final OrderRepository orders;
    private final AuditService audit;

    public AdminShopService(DropRepository drops, DropProductRepository dropProducts, ProductRepository products,
                            StockReservationRepository reservations, OrderRepository orders, AuditService audit) {
        this.drops = drops;
        this.dropProducts = dropProducts;
        this.products = products;
        this.reservations = reservations;
        this.orders = orders;
        this.audit = audit;
    }

    // ---------- drops ----------

    @Transactional(readOnly = true)
    public List<AdminDropDto> listDrops() {
        Instant now = Instant.now();
        return drops.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().map(d -> toDto(d, now)).toList();
    }

    @Transactional(readOnly = true)
    public AdminDropDto getDrop(UUID id) {
        return toDto(findDrop(id), Instant.now());
    }

    @Transactional
    public AdminDropDto createDrop(DropUpsertRequest r) {
        validateDates(r.opensAt(), r.closesAt());
        String base = StringUtils.hasText(r.slug()) ? SlugUtils.slugify(r.slug()) : SlugUtils.slugify(r.title());
        Drop d = Drop.builder()
                .slug(SlugUtils.unique(base, drops::existsBySlug))
                .lifecycle(DropLifecycle.DRAFT)
                .build();
        applyDrop(d, r);
        drops.save(d);
        relink(d, r.productIds());
        audit.log("drop.create", "drop", d.getId(), d.getTitle());
        return toDto(d, Instant.now());
    }

    @Transactional
    public AdminDropDto updateDrop(UUID id, DropUpsertRequest r) {
        Drop d = findDrop(id);
        validateDates(r.opensAt(), r.closesAt());
        if (StringUtils.hasText(r.slug())) {
            String wanted = SlugUtils.slugify(r.slug());
            if (!wanted.equals(d.getSlug())) {
                if (drops.existsBySlugAndIdNot(wanted, id)) {
                    throw new IllegalStateException("Le slug « " + wanted + " » est déjà utilisé.");
                }
                d.setSlug(wanted);
            }
        }
        applyDrop(d, r);
        relink(d, r.productIds());
        if (d.getLifecycle() == DropLifecycle.PUBLISHED) assertPublishable(d);
        audit.log("drop.update", "drop", id, d.getTitle());
        return toDto(d, Instant.now());
    }

    @Transactional
    public AdminDropDto setLifecycle(UUID id, DropLifecycle lifecycle) {
        Drop d = findDrop(id);
        if (lifecycle == DropLifecycle.PUBLISHED) assertPublishable(d);
        d.setLifecycle(lifecycle);
        audit.log("drop.lifecycle", "drop", id, d.getTitle() + " → " + lifecycle);
        return toDto(d, Instant.now());
    }

    @Transactional
    public void deleteDrop(UUID id) {
        Drop d = findDrop(id);
        if (d.getLifecycle() == DropLifecycle.PUBLISHED) {
            throw new IllegalStateException("Un drop publié ne peut pas être supprimé : archivez-le ou repassez-le en brouillon.");
        }
        dropProducts.deleteAllByDropId(id);
        drops.delete(d);
        audit.log("drop.delete", "drop", id, d.getTitle());
    }

    private void assertPublishable(Drop d) {
        if (d.getOpensAt() == null || d.getClosesAt() == null) {
            throw new IllegalStateException("Un drop publié doit avoir une date d'ouverture et une date de fermeture.");
        }
        if (!d.getClosesAt().isAfter(d.getOpensAt())) {
            throw new IllegalStateException("La fermeture doit être postérieure à l'ouverture.");
        }
        if (dropProducts.findAllByDropIdOrderByDisplayOrderAsc(d.getId()).isEmpty()) {
            throw new IllegalStateException("Un drop publié doit proposer au moins une pièce.");
        }
    }

    private static void validateDates(Instant opensAt, Instant closesAt) {
        if (opensAt != null && closesAt != null && !closesAt.isAfter(opensAt)) {
            throw new IllegalStateException("La fermeture doit être postérieure à l'ouverture.");
        }
    }

    private static void applyDrop(Drop d, DropUpsertRequest r) {
        d.setTitle(r.title().trim());
        d.setSubtitle(blankToNull(r.subtitle()));
        d.setHeroImage(blankToNull(r.heroImage()));
        d.setOpensAt(r.opensAt());
        d.setClosesAt(r.closesAt());
        d.setMaxPerCustomer(r.maxPerCustomer());
    }

    private void relink(Drop d, List<UUID> productIds) {
        List<Product> wanted = new ArrayList<>();
        if (productIds != null) {
            for (UUID pid : productIds) {
                wanted.add(products.findById(pid).orElseThrow(() -> new NotFoundException("Pièce introuvable : " + pid)));
            }
        }
        dropProducts.deleteAllByDropId(d.getId());
        dropProducts.flush();
        for (int i = 0; i < wanted.size(); i++) {
            dropProducts.save(DropProduct.builder().drop(d).product(wanted.get(i)).displayOrder(i).build());
        }
    }

    private AdminDropDto toDto(Drop d, Instant now) {
        List<AdminProductDto> list = dropProducts.findAllByDropIdOrderByDisplayOrderAsc(d.getId()).stream()
                .map(dp -> toDto(dp.getProduct())).toList();
        return AdminDropDto.from(d, list, now);
    }

    private Drop findDrop(UUID id) {
        return drops.findById(id).orElseThrow(() -> new NotFoundException("Drop introuvable : " + id));
    }

    // ---------- pièces ----------

    @Transactional(readOnly = true)
    public List<AdminProductDto> listProducts() {
        return products.findAll(Sort.by("name")).stream().map(this::toDto).toList();
    }

    @Transactional
    public AdminProductDto createProduct(ProductUpsertRequest r) {
        Product p = new Product();
        applyProduct(p, r);
        products.save(p);
        audit.log("product.create", "product", p.getId(), p.getName() + " · stock " + p.getStock());
        return toDto(p);
    }

    @Transactional
    public AdminProductDto updateProduct(UUID id, ProductUpsertRequest r) {
        Product p = products.findByIdForUpdate(id).orElseThrow(() -> new NotFoundException("Pièce introuvable : " + id));
        long reserved = reservations.sumQuantityByProductAndStatus(id, ReservationStatus.ACTIVE);
        if (r.stock() < reserved) {
            throw new IllegalStateException("Le stock ne peut pas descendre sous les " + reserved + " unité(s) actuellement réservées.");
        }
        applyProduct(p, r);
        audit.log("product.update", "product", id, p.getName() + " · stock " + p.getStock() + " · " + (p.isAvailable() ? "active" : "inactive"));
        return toDto(p);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        Product p = products.findById(id).orElseThrow(() -> new NotFoundException("Pièce introuvable : " + id));
        if (!dropProducts.findAllByProductId(id).isEmpty()) {
            throw new IllegalStateException("Cette pièce est liée à un drop. Retirez-la du drop avant de la supprimer.");
        }
        try {
            products.delete(p);
            products.flush();
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Cette pièce apparaît dans des commandes : désactivez-la plutôt que de la supprimer.");
        }
        audit.log("product.delete", "product", id, p.getName());
    }

    private AdminProductDto toDto(Product p) {
        return AdminProductDto.from(p, reservations.sumQuantityByProductAndStatus(p.getId(), ReservationStatus.ACTIVE));
    }

    private static void applyProduct(Product p, ProductUpsertRequest r) {
        p.setName(r.name().trim());
        p.setTagline(blankToNull(r.tagline()));
        p.setPriceCents(r.priceCents());
        p.setCurrency(r.currency().toUpperCase(Locale.ROOT));
        p.setEdition(blankToNull(r.edition()));
        p.setStock(r.stock());
        p.setAvailable(r.available());
    }

    // ---------- commandes ----------

    @Transactional(readOnly = true)
    public List<AdminOrderDto> listOrders() {
        return orders.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().map(AdminOrderDto::from).toList();
    }

    @Transactional
    public AdminOrderDto markFulfilled(UUID id) {
        Order o = orders.findById(id).orElseThrow(() -> new NotFoundException("Commande introuvable : " + id));
        if (o.getStatus() != OrderStatus.PAID) {
            throw new IllegalStateException("Seule une commande payée peut être marquée expédiée.");
        }
        o.setStatus(OrderStatus.FULFILLED);
        audit.log("order.fulfill", "order", id, null);
        return AdminOrderDto.from(o);
    }

    private static String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }
}
