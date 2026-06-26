package com.cabanedulys.api.dto;

/** Ligne de transcription : timecode (s) + texte. */
public record TranscriptLineDto(int t, String text) {}
