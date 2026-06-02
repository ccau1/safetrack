package com.safetrack.shared.dto;

import java.util.List;

public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
    public PagedResponse(List<T> content, int page, int size, long totalElements) {
        this(
            content,
            page,
            size,
            totalElements,
            (int) Math.ceil((double) totalElements / size),
            page == 0,
            (page + 1) * size >= totalElements
        );
    }
}
