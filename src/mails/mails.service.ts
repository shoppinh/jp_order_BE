import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class MailsService {
  constructor(private mailerService: MailerService) {}

  async sendUserResetPasswordLink(email: string, token: string) {
    const url = `${process.env.APP_URL}/reset-password/${token}`;
    const home_url = process.env.APP_URL;
    const external_content = `<p>To finish resetting your account password, simply click on this <a href="${url}">link</a></p>`;

    return this.mailerService
      .sendMail({
        to: email,
        // from: '"Support Team" <support@example.com>', // override default from
        subject: 'Reset password link',
        template: 'reset-password', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: email,
          home_url,
          external_content,
        },
      })
      .catch((error) => {
        console.log(Date(), 'error', error);
        throw new BadRequestException("Can't send invitation email");
      });
  }
}
