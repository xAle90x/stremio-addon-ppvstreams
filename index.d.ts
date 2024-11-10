export interface IPPVLandStream {
    category:    string;
    id:          number;
    always_live: number;
    streams:     Stream[];
}

export interface Stream {
    id:               number;
    name:             string;
    tag:              string;
    poster:           string;
    uri_name:         string;
    starts_at:        number;
    ends_at:          number;
    always_live:      number;
    category_name:    string;
    allowpaststreams: number;
}
export interface IPPLandStreamDetails {
    success: boolean;
    data:    Data;
}

export interface Data {
    id:              number;
    name:            string;
    poster:          string;
    tag:             string;
    description:     string;
    m3u8:            string;
    source:          string;
    source_type:     string;
    start_timestamp: number;
    end_timestamp:   number;
    vip_stream:      number;
    auth:            boolean;
    edit:            null;
    server_id:       number;
    clipping:        boolean;
    token:           null;
    vip_mpegts:      string;
}
