package com.cabanedulys.api.dto.admin;

import com.cabanedulys.api.models.DropLifecycle;
import jakarta.validation.constraints.NotNull;

public record DropLifecycleRequest(@NotNull DropLifecycle lifecycle) {}
