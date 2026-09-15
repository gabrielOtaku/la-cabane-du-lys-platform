package com.cabanedulys.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Ligne de transcription : timecode (s) + texte. */
public record TranscriptLineDto(@Min(0) int t, @NotBlank @Size(max = 2000) String text) {}
