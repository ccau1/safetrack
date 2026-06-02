package com.safetrack.server.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class NotificationUserReadId implements Serializable {

    @Column(name = "notification_id")
    private UUID notificationId;

    @Column(name = "user_id")
    private UUID userId;
}
