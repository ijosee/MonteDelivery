/**
 * Supabase Database Types — Pueblo Delivery Marketplace
 *
 * These types mirror the PostgreSQL schema hosted on Supabase.
 * Regenerate with: pnpm run gen:types
 *
 * 22 tables, 5 enums.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          emailVerified: string | null;
          passwordHash: string | null;
          image: string | null;
          role: Database["public"]["Enums"]["UserRole"];
          failedLoginAttempts: number;
          lockedUntil: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          emailVerified?: string | null;
          passwordHash?: string | null;
          image?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
          failedLoginAttempts?: number;
          lockedUntil?: string | null;
          createdAt?: string;
          updatedAt: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          emailVerified?: string | null;
          passwordHash?: string | null;
          image?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
          failedLoginAttempts?: number;
          lockedUntil?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "auth_accounts_userId_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "auth_accounts";
            referencedColumns: ["userId"];
          },
        ];
      };
      auth_accounts: {
        Row: {
          id: string;
          userId: string;
          type: string;
          provider: string;
          providerAccountId: string;
          refresh_token: string | null;
          access_token: string | null;
          expires_at: number | null;
          token_type: string | null;
          scope: string | null;
          id_token: string | null;
          session_state: string | null;
        };
        Insert: {
          id?: string;
          userId: string;
          type: string;
          provider: string;
          providerAccountId: string;
          refresh_token?: string | null;
          access_token?: string | null;
          expires_at?: number | null;
          token_type?: string | null;
          scope?: string | null;
          id_token?: string | null;
          session_state?: string | null;
        };
        Update: {
          id?: string;
          userId?: string;
          type?: string;
          provider?: string;
          providerAccountId?: string;
          refresh_token?: string | null;
          access_token?: string | null;
          expires_at?: number | null;
          token_type?: string | null;
          scope?: string | null;
          id_token?: string | null;
          session_state?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "auth_accounts_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          sessionToken: string;
          userId: string;
          expires: string;
        };
        Insert: {
          id?: string;
          sessionToken: string;
          userId: string;
          expires: string;
        };
        Update: {
          id?: string;
          sessionToken?: string;
          userId?: string;
          expires?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          imageUrl: string | null;
          cuisineType: string | null;
          deliveryFeeEur: number;
          minOrderEur: number;
          deliveryRadiusKm: number;
          lat: number;
          lng: number;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          imageUrl?: string | null;
          cuisineType?: string | null;
          deliveryFeeEur: number;
          minOrderEur: number;
          deliveryRadiusKm: number;
          lat: number;
          lng: number;
          isActive?: boolean;
          createdAt?: string;
          updatedAt: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          imageUrl?: string | null;
          cuisineType?: string | null;
          deliveryFeeEur?: number;
          minOrderEur?: number;
          deliveryRadiusKm?: number;
          lat?: number;
          lng?: number;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      restaurant_users: {
        Row: {
          id: string;
          userId: string;
          restaurantId: string;
          role: Database["public"]["Enums"]["RestaurantUserRole"];
        };
        Insert: {
          id?: string;
          userId: string;
          restaurantId: string;
          role: Database["public"]["Enums"]["RestaurantUserRole"];
        };
        Update: {
          id?: string;
          userId?: string;
          restaurantId?: string;
          role?: Database["public"]["Enums"]["RestaurantUserRole"];
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_users_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "restaurant_users_restaurantId_fkey";
            columns: ["restaurantId"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      opening_hours: {
        Row: {
          id: string;
          restaurantId: string;
          dayOfWeek: number;
          openTime: string;
          closeTime: string;
        };
        Insert: {
          id?: string;
          restaurantId: string;
          dayOfWeek: number;
          openTime: string;
          closeTime: string;
        };
        Update: {
          id?: string;
          restaurantId?: string;
          dayOfWeek?: number;
          openTime?: string;
          closeTime?: string;
        };
        Relationships: [
          {
            foreignKeyName: "opening_hours_restaurantId_fkey";
            columns: ["restaurantId"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_zones: {
        Row: {
          id: string;
          restaurantId: string;
          radiusKm: number;
          lat: number;
          lng: number;
        };
        Insert: {
          id?: string;
          restaurantId: string;
          radiusKm: number;
          lat: number;
          lng: number;
        };
        Update: {
          id?: string;
          restaurantId?: string;
          radiusKm?: number;
          lat?: number;
          lng?: number;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_zones_restaurantId_fkey";
            columns: ["restaurantId"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          restaurantId: string;
          name: string;
          sortOrder: number;
          createdAt: string;
        };
        Insert: {
          id?: string;
          restaurantId: string;
          name: string;
          sortOrder?: number;
          createdAt?: string;
        };
        Update: {
          id?: string;
          restaurantId?: string;
          name?: string;
          sortOrder?: number;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_restaurantId_fkey";
            columns: ["restaurantId"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          categoryId: string;
          name: string;
          description: string | null;
          priceEur: number;
          imageUrl: string;
          isAvailable: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          categoryId: string;
          name: string;
          description?: string | null;
          priceEur: number;
          imageUrl: string;
          isAvailable?: boolean;
          createdAt?: string;
          updatedAt: string;
        };
        Update: {
          id?: string;
          categoryId?: string;
          name?: string;
          description?: string | null;
          priceEur?: number;
          imageUrl?: string;
          isAvailable?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_categoryId_fkey";
            columns: ["categoryId"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      allergens: {
        Row: {
          id: number;
          code: string;
          nameEs: string;
          icon: string;
        };
        Insert: {
          id: number;
          code: string;
          nameEs: string;
          icon: string;
        };
        Update: {
          id?: number;
          code?: string;
          nameEs?: string;
          icon?: string;
        };
        Relationships: [];
      };
      product_allergens: {
        Row: {
          id: string;
          productId: string;
          allergenId: number;
        };
        Insert: {
          id?: string;
          productId: string;
          allergenId: number;
        };
        Update: {
          id?: string;
          productId?: string;
          allergenId?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_allergens_productId_fkey";
            columns: ["productId"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_allergens_allergenId_fkey";
            columns: ["allergenId"];
            isOneToOne: false;
            referencedRelation: "allergens";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          id: string;
          userId: string;
          restaurantId: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          restaurantId?: string | null;
          createdAt?: string;
          updatedAt: string;
        };
        Update: {
          id?: string;
          userId?: string;
          restaurantId?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carts_userId_fkey";
            columns: ["userId"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "carts_restaurantId_fkey";
            columns: ["restaurantId"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      cart_items: {
        Row: {
          id: string;
          cartId: string;
          productId: string;
          quantity: number;
          notes: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          cartId: string;
          productId: string;
          quantity?: number;
          notes?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          cartId?: string;
          productId?: string;
          quantity?: number;
          notes?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cartId_fkey";
            columns: ["cartId"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_productId_fkey";
            columns: ["productId"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      addresses: {
        Row: {
          id: string;
          userId: string;
          label: string | null;
          street: string;
          municipality: string;
          city: string;
          postalCode: string;
          floorDoor: string | null;
          lat: number;
          lng: number;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          label?: string | null;
          street: string;
          municipality: string;
          city: string;
          postalCode: string;
          floorDoor?: string | null;
          lat: number;
          lng: number;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          label?: string | null;
          street?: string;
          municipality?: string;
          city?: string;
          postalCode?: string;
          floorDoor?: string | null;
          lat?: number;
          lng?: number;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      geocoding_cache: {
        Row: {
          id: string;
          normalizedAddress: string;
          lat: number;
          lng: number;
          comunidadAutonoma: string | null;
          municipality: string | null;
          postalCode: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          normalizedAddress: string;
          lat: number;
          lng: number;
          comunidadAutonoma?: string | null;
          municipality?: string | null;
          postalCode?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          normalizedAddress?: string;
          lat?: number;
          lng?: number;
          comunidadAutonoma?: string | null;
          municipality?: string | null;
          postalCode?: string | null;
          createdAt?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          orderNumber: number;
          userId: string;
          restaurantId: string;
          addressId: string;
          phone: string;
          fulfillmentType: Database["public"]["Enums"]["FulfillmentType"];
          scheduledFor: string | null;
          subtotalEur: number;
          deliveryFeeEur: number;
          totalEur: number;
          currentStatus: Database["public"]["Enums"]["OrderStatus"];
          eta: string | null;
          etaWindowEnd: string | null;
          idempotencyKey: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          orderNumber?: number;
          userId: string;
          restaurantId: string;
          addressId: string;
          phone: string;
          fulfillmentType: Database["public"]["Enums"]["FulfillmentType"];
          scheduledFor?: string | null;
          subtotalEur: number;
          deliveryFeeEur: number;
          totalEur: number;
          currentStatus?: Database["public"]["Enums"]["OrderStatus"];
          eta?: string | null;
          etaWindowEnd?: string | null;
          idempotencyKey: string;
          createdAt?: string;
          updatedAt: string;
        };
        Update: {
          id?: string;
          orderNumber?: number;
          userId?: string;
          restaurantId?: string;
          addressId?: string;
          phone?: string;
          fulfillmentType?: Database["public"]["Enums"]["FulfillmentType"];
          scheduledFor?: string | null;
          subtotalEur?: number;
          deliveryFeeEur?: number;
          totalEur?: number;
          currentStatus?: Database["public"]["Enums"]["OrderStatus"];
          eta?: string | null;
          etaWindowEnd?: string | null;
          idempotencyKey?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_restaurantId_fkey";
            columns: ["restaurantId"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_addressId_fkey";
            columns: ["addressId"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          orderId: string;
          productId: string;
          productName: string;
          productPriceEur: number;
          quantity: number;
          createdAt: string;
        };
        Insert: {
          id?: string;
          orderId: string;
          productId: string;
          productName: string;
          productPriceEur: number;
          quantity: number;
          createdAt?: string;
        };
        Update: {
          id?: string;
          orderId?: string;
          productId?: string;
          productName?: string;
          productPriceEur?: number;
          quantity?: number;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_orderId_fkey";
            columns: ["orderId"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_productId_fkey";
            columns: ["productId"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          orderId: string;
          fromStatus: Database["public"]["Enums"]["OrderStatus"] | null;
          toStatus: Database["public"]["Enums"]["OrderStatus"];
          changedByUserId: string;
          reason: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          orderId: string;
          fromStatus?: Database["public"]["Enums"]["OrderStatus"] | null;
          toStatus: Database["public"]["Enums"]["OrderStatus"];
          changedByUserId: string;
          reason?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          orderId?: string;
          fromStatus?: Database["public"]["Enums"]["OrderStatus"] | null;
          toStatus?: Database["public"]["Enums"]["OrderStatus"];
          changedByUserId?: string;
          reason?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_orderId_fkey";
            columns: ["orderId"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_changedByUserId_fkey";
            columns: ["changedByUserId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      cookie_consents: {
        Row: {
          id: string;
          userId: string | null;
          consentType: Database["public"]["Enums"]["ConsentType"];
          decision: boolean;
          ipAddress: string | null;
          userAgent: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId?: string | null;
          consentType: Database["public"]["Enums"]["ConsentType"];
          decision: boolean;
          ipAddress?: string | null;
          userAgent?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string | null;
          consentType?: Database["public"]["Enums"]["ConsentType"];
          decision?: boolean;
          ipAddress?: string | null;
          userAgent?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cookie_consents_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      legal_acceptances: {
        Row: {
          id: string;
          userId: string;
          documentType: string;
          documentVersion: string;
          ipAddress: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          documentType: string;
          documentVersion: string;
          ipAddress?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          documentType?: string;
          documentVersion?: string;
          ipAddress?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      phone_verifications: {
        Row: {
          id: string;
          userId: string;
          phone: string;
          code: string;
          expiresAt: string;
          verified: boolean;
          attempts: number;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          phone: string;
          code: string;
          expiresAt: string;
          verified?: boolean;
          attempts?: number;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          phone?: string;
          code?: string;
          expiresAt?: string;
          verified?: boolean;
          attempts?: number;
          createdAt?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          userId: string;
          action: string;
          resourceType: string;
          resourceId: string | null;
          details: Json | null;
          ipAddress: string | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          action: string;
          resourceType: string;
          resourceId?: string | null;
          details?: Json | null;
          ipAddress?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          action?: string;
          resourceType?: string;
          resourceId?: string | null;
          details?: Json | null;
          ipAddress?: string | null;
          createdAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_order_transaction: {
        Args: {
          p_user_id: string;
          p_restaurant_id: string;
          p_address_id: string;
          p_phone: string;
          p_fulfillment_type: string;
          p_scheduled_for: string | null;
          p_subtotal_eur: number;
          p_delivery_fee_eur: number;
          p_total_eur: number;
          p_eta: string;
          p_eta_window_end: string | null;
          p_idempotency_key: string;
          p_items: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      UserRole: "CUSTOMER" | "RESTAURANT_OWNER" | "RESTAURANT_STAFF" | "ADMIN";
      RestaurantUserRole: "OWNER" | "STAFF";
      OrderStatus:
        | "PLACED"
        | "ACCEPTED"
        | "REJECTED"
        | "PREPARING"
        | "READY_FOR_PICKUP"
        | "OUT_FOR_DELIVERY"
        | "DELIVERED"
        | "CANCELLED";
      FulfillmentType: "ASAP" | "SCHEDULED";
      ConsentType: "NECESSARY" | "ANALYTICS" | "MARKETING";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Auxiliary enum types ────────────────────────────────────────────────────

export type UserRole = Database["public"]["Enums"]["UserRole"];
export type OrderStatus = Database["public"]["Enums"]["OrderStatus"];
export type FulfillmentType = Database["public"]["Enums"]["FulfillmentType"];
export type RestaurantUserRole = Database["public"]["Enums"]["RestaurantUserRole"];
export type ConsentType = Database["public"]["Enums"]["ConsentType"];

// ─── Table row helpers ──────────────────────────────────────────────────────

type Tables = Database["public"]["Tables"];
export type TableRow<T extends keyof Tables> = Tables[T]["Row"];
export type TableInsert<T extends keyof Tables> = Tables[T]["Insert"];
export type TableUpdate<T extends keyof Tables> = Tables[T]["Update"];
