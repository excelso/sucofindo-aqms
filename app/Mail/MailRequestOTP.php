<?php

    namespace App\Mail;

    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Mail\Mailable;
    use Illuminate\Mail\Mailables\Content;
    use Illuminate\Mail\Mailables\Envelope;
    use Illuminate\Queue\SerializesModels;

    class MailRequestOTP extends Mailable {
        use Queueable, SerializesModels;

        /**
         * Create a new message instance.
         *
         * @return void
         */
        public function __construct(private string $title, private mixed $data, private array $attachment) {
            //
        }

        /**
         * Get the message envelope.
         *
         * @return \Illuminate\Mail\Mailables\Envelope
         */
        public function envelope(): Envelope {
            return new Envelope(
                subject: $this->title,
            );
        }

        /**
         * Get the message content definition.
         *
         * @return \Illuminate\Mail\Mailables\Content
         */
        public function content(): Content {
            return new Content(
                view: 'email.request-otp.index',
                with: [
                    'data' => $this->data
                ]
            );
        }

        /**
         * Get the attachments for the message.
         *
         * @return array
         */
        public function attachments(): array {
            return $this->attachment;
        }
    }
