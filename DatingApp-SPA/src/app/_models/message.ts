export class Message {
    id: number;
    senderId: number;
    senderKnownAs: string;
    senderPhotoUrl: string;
    recipientId: number;
    recipientKnownAs: string;
    recipientPhotoUrl: string;
    content: string;
    isRead: boolean;
    readDate: any;
    isReceived: boolean;
    receivedDate: any;
    sentDate: any;
}
