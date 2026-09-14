package com.cabanedulys.api.controllers;

import com.cabanedulys.api.dto.admin.*;
import com.cabanedulys.api.services.admin.AdminShopService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Back office — La Réserve : drops, pièces et commandes. */
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminShopController {

    private final AdminShopService service;

    public AdminShopController(AdminShopService service) { this.service = service; }

    // ---------- drops ----------

    @GetMapping("/drops")
    public List<AdminDropDto> drops() { return service.listDrops(); }

    @GetMapping("/drops/{id}")
    public AdminDropDto drop(@PathVariable UUID id) { return service.getDrop(id); }

    @PostMapping("/drops")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminDropDto createDrop(@Valid @RequestBody DropUpsertRequest req) { return service.createDrop(req); }

    @PutMapping("/drops/{id}")
    public AdminDropDto updateDrop(@PathVariable UUID id, @Valid @RequestBody DropUpsertRequest req) {
        return service.updateDrop(id, req);
    }

    @PutMapping("/drops/{id}/lifecycle")
    public AdminDropDto lifecycle(@PathVariable UUID id, @Valid @RequestBody DropLifecycleRequest req) {
        return service.setLifecycle(id, req.lifecycle());
    }

    @DeleteMapping("/drops/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDrop(@PathVariable UUID id) { service.deleteDrop(id); }

    // ---------- pièces ----------

    @GetMapping("/products")
    public List<AdminProductDto> products() { return service.listProducts(); }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminProductDto createProduct(@Valid @RequestBody ProductUpsertRequest req) { return service.createProduct(req); }

    @PutMapping("/products/{id}")
    public AdminProductDto updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductUpsertRequest req) {
        return service.updateProduct(id, req);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable UUID id) { service.deleteProduct(id); }

    // ---------- commandes ----------

    @GetMapping("/orders")
    public List<AdminOrderDto> orders() { return service.listOrders(); }

    @PostMapping("/orders/{id}/fulfill")
    public AdminOrderDto fulfill(@PathVariable UUID id) { return service.markFulfilled(id); }
}
