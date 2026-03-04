import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ContactFormSubmission {
    name: string;
    email: string;
    message: string;
    timestamp: Time;
}
export type Time = bigint;
export interface backendInterface {
    getAllContactSubmissions(): Promise<Array<ContactFormSubmission>>;
    getVisitorCount(): Promise<bigint>;
    incrementVisitorCount(): Promise<bigint>;
    submitContactForm(name: string, email: string, message: string): Promise<void>;
}
