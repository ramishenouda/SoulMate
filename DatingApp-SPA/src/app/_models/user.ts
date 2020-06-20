import { Photo } from './photo';

export class User {
    id: number;
    username: string;
    knownAs: string;
    age: number;
    gender: string;
    created: Date;
    lastActive: any;
    photoUrl: string;
    city: string;
    country: string;
    lookingFor: string;
    interests?: string;
    introduction?: string;
    photos?: Photo[];
    canMessage: boolean;
    isSoul: boolean;
    likee: boolean;
}
