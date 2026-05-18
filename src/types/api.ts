type LoginResponse = {
    access_token: string;
    role: string;
};

type ImportResponse = {
    imported_orders: number;
    imported_vehicles: number;
    imported_warehouses: number;
};

type Order = {
    order_id: string;
    warehouse_id: string;
    lat: number;
    lng: number;
    weight: number;
    volume: number;
    status: string;
};

type Vehicle = {
    vehicle_id: string;
    current_warehouse_id: string;
    max_weight: number;
    max_volume: number;
};

type Warehouse = {
    warehouse_id: string;
    name: string;
    lat: number;
    lng: number;
};

type Stop = {
    order_id: string;
    lat: number;
    lng: number;
};

type Route = {
    vehicle_id: string;
    stops: Stop[];
    total_distance_km: number;
    geometry: [number, number][];
};

type VehicleKpi = {
    vehicle_id: string;
    stops_count: number;
    distance_km: number;
    fill_rate_weight: number;
    fill_rate_volume: number;
};

type KPI = {
    total_distance_km: number;
    vehicles_used: number;
    unassigned_count: number;
    average_fill_rate_weight: number;
    average_fill_rate_volume: number;
    per_vehicle: VehicleKpi[];
};

type OptimizeResponse = {
    results: {
        solver: string;
        routes: Route[];
        unassigned_orders: string[];
        kpi: KPI;
    }[];
};

type PaginatedResponse<T> = {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
};

type JobResponse = {
    job_id: string;
    status: 'pending' | 'success' | 'failure' | 'expired';
    result: OptimizeResponse | null;
    error: string | null;
};

export type {
    LoginResponse,
    ImportResponse,
    PaginatedResponse,
    Order,
    Vehicle,
    Warehouse,
    OptimizeResponse,
    JobResponse,
    Route,
    Stop,
    VehicleKpi,
    KPI,
};
