package com.safetrack.shared.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PagedResponseTest {

    @Test
    void constructor_shouldCalculateDerivedFields() {
        List<String> content = List.of("a", "b", "c");
        PagedResponse<String> response = new PagedResponse<>(content, 0, 10, 25);

        assertEquals(content, response.content());
        assertEquals(0, response.page());
        assertEquals(10, response.size());
        assertEquals(25, response.totalElements());
        assertEquals(3, response.totalPages());
        assertTrue(response.first());
        assertFalse(response.last());
    }

    @Test
    void constructor_shouldMarkLastPage() {
        List<String> content = List.of("a", "b");
        PagedResponse<String> response = new PagedResponse<>(content, 2, 10, 22);

        assertFalse(response.first());
        assertTrue(response.last());
    }

    @Test
    void constructor_shouldHandleEmptyContent() {
        PagedResponse<String> response = new PagedResponse<>(List.of(), 0, 10, 0);

        assertTrue(response.first());
        assertTrue(response.last());
        assertEquals(0, response.totalPages());
    }

    @Test
    void constructor_shouldHandleSinglePage() {
        List<String> content = List.of("a");
        PagedResponse<String> response = new PagedResponse<>(content, 0, 10, 1);

        assertEquals(1, response.totalPages());
        assertTrue(response.first());
        assertTrue(response.last());
    }
}
