import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'bizy83724@gmail.com',
    pass: process.env.EMAIL_PASS || 'ddrd kpnn ptjb zxnt',
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: '"BiZy Freelancing" <bizy83724@gmail.com>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('❌ Email sending failed:', err);
  }
};

export const sendPaymentSuccessEmailToBuyer = async (purchase, buyer, project) => {
  const subject = `🎉 Thank You for Your Order - ${project.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">🎉 Thank You for Your Order!</h1>
        </div>
        
        <p>Dear <strong>${buyer.username || buyer.Fullname || 'Valued Customer'}</strong>,</p>
        
        <p>Thank you for placing your order with BiZy Freelancing! Your payment has been successfully processed.</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Order Details:</h3>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Order ID:</strong> ${purchase._id}</p>
          <p><strong>Amount Paid:</strong> $${purchase.amount}</p>
          <p><strong>Payment Method:</strong> ${purchase.paymentMethod === 'card' ? 'Credit/Debit Card' : purchase.paymentMethod === 'wallet' ? 'Wallet Earnings' : 'PayTabs'}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Paid</span></p>
          <p><strong>Delivery Status:</strong> <span style="color: #ffc107; font-weight: bold;">Not Started</span></p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">🔒 Secure Processing System</h4>
          <p>Your order is now being processed through our secure system. We manually verify each order to ensure quality and protect both buyers and sellers.</p>
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>Our team will review your order requirements</li>
            <li>The seller will be notified of your purchase</li>
            <li>Work will begin once verification is complete</li>
            <li>You'll receive updates on the delivery progress</li>
          </ul>
          <p><em>This process may take some time for your protection and to ensure the highest quality delivery.</em></p>
        </div>
        
        <p>You can track your order status in your dashboard at any time.</p>
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>
        <strong>The BiZy Freelancing Team</strong></p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </div>
  `;
  
  await sendEmail(buyer.email, subject, html);
};

export const sendPaymentNotificationToSeller = async (purchase, seller, project, buyer) => {
  const subject = `💰 New Payment Received - ${project.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                 <div style="text-align: center; margin-bottom: 30px;">
           <h1 style="color: #28a745; margin: 0;">💰 New Order!</h1>
         </div>
        
        <p>Dear <strong>${seller.username || seller.Fullname || 'Seller'}</strong>,</p>
        
        <p>Great news! You have received a new payment for your project.</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Project Details:</h3>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Order ID:</strong> ${purchase._id}</p>
          <p><strong>Amount:</strong> $${purchase.amount}</p>
          <p><strong>Payment Method:</strong> ${purchase.paymentMethod === 'card' ? 'Credit/Debit Card' : purchase.paymentMethod === 'wallet' ? 'Wallet Earnings' : 'PayTabs'}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Paid</span></p>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #0c5460; margin-top: 0;">📋 Next Steps:</h4>
          <p>Please check your dashboard for the complete order details and buyer requirements. You should:</p>
          <ul>
            <li>Review the buyer's requirements carefully</li>
            <li>Start working on the project</li>
            <li>Update the delivery status as you progress</li>
            <li>Deliver the completed work on time</li>
          </ul>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">⚠️ Important Reminder:</h4>
          <p>Remember to maintain high quality standards and communicate with the buyer throughout the process. Your reputation depends on successful deliveries!</p>
        </div>
        
        <p>Log in to your dashboard to view the complete order details and begin working.</p>
        
        <p>Best regards,<br>
        <strong>The BiZy Freelancing Team</strong></p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </div>
  `;
  
  await sendEmail(seller.email, subject, html);
};

export const sendProjectSubmissionEmailToSeller = async (purchase, seller, project, buyer) => {
  const subject = `📋 Project Submitted Successfully - ${project.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">📋 Project Submitted Successfully!</h1>
        </div>
        
        <p>Dear <strong>${seller.username || seller.Fullname || 'Seller'}</strong>,</p>
        
        <p>Great news! Your project submission has been successfully received and is now under review.</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Project Details:</h3>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Order ID:</strong> ${purchase._id}</p>
          <p><strong>Buyer:</strong> ${buyer.username || buyer.Fullname || 'Client'}</p>
          <p><strong>Amount:</strong> $${purchase.amount}</p>
          <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Under Review</span></p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">🔒 Security Review Process</h4>
          <p>Your project is now being reviewed by our security team to ensure:</p>
          <ul>
            <li>Code quality and functionality</li>
            <li>Security best practices</li>
            <li>Content safety and compliance</li>
            <li>Proper documentation and setup</li>
          </ul>
          <p><em>This review process may take some time for your protection and to ensure the highest quality delivery to the client.</em></p>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #0c5460; margin-top: 0;">💰 Payment Information</h4>
          <p>Once the review is complete and the project is approved, you will automatically receive your payment of <strong>$${purchase.amount}</strong>.</p>
          <p>We will notify you immediately when the review is complete.</p>
        </div>
        
        <p>Thank you for your patience and professional work!</p>
        
        <p>Best regards,<br>
        <strong>The BiZy Freelancing Team</strong></p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </div>
  `;
  
  await sendEmail(seller.email, subject, html);
};

export const sendProjectSubmissionEmailToBuyer = async (purchase, buyer, project, seller) => {
  const subject = `🎉 Your Project is Under Review - ${project.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">🎉 Your Project is Under Review!</h1>
        </div>
        
        <p>Dear <strong>${buyer.username || buyer.Fullname || 'Valued Client'}</strong>,</p>
        
        <p>Excellent news! Your project has been successfully submitted and is now under review by our team.</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Project Details:</h3>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Order ID:</strong> ${purchase._id}</p>
          <p><strong>Developer:</strong> ${seller.username || seller.Fullname || 'Professional Developer'}</p>
          <p><strong>Amount Paid:</strong> $${purchase.amount}</p>
          <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Under Review</span></p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">🔍 Review Process</h4>
          <p>Our expert team is now reviewing your project to ensure:</p>
          <ul>
            <li>All requirements have been met</li>
            <li>Code quality and security standards</li>
            <li>Proper functionality and testing</li>
            <li>Complete documentation and setup instructions</li>
          </ul>
          <p><em>This thorough review process ensures you receive a high-quality, secure, and fully functional project.</em></p>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #0c5460; margin-top: 0;">⏱️ Timeline</h4>
          <p>We aim to complete the review process as quickly as possible while maintaining our high quality standards.</p>
          <p>You will receive an email notification as soon as the review is complete and your project is ready for delivery.</p>
        </div>
        
        <p>Thank you for choosing BiZy Freelancing!</p>
        
        <p>Best regards,<br>
        <strong>The BiZy Freelancing Team</strong></p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </div>
  `;
  
  await sendEmail(buyer.email, subject, html);
};

export const sendProjectSubmissionEmailToAdmins = async (purchase, project, seller, buyer) => {
  const subject = `🚨 New Project Under Review - ${project.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc3545; margin: 0;">🚨 New Project Under Review</h1>
        </div>
        
        <p>Dear <strong>Admin Team</strong>,</p>
        
        <p>A new project has been submitted and requires your review.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #721c24; margin-top: 0;">Project Details:</h3>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Order ID:</strong> ${purchase._id}</p>
          <p><strong>Seller:</strong> ${seller.username || seller.Fullname || 'Unknown'} (${seller.email})</p>
          <p><strong>Buyer:</strong> ${buyer.username || buyer.Fullname || 'Unknown'} (${buyer.email})</p>
          <p><strong>Amount:</strong> $${purchase.amount}</p>
          <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">⚠️ Action Required</h4>
          <p>Please review this project submission as soon as possible for:</p>
          <ul>
            <li>Code quality and functionality</li>
            <li>Security compliance</li>
            <li>Content safety</li>
            <li>Documentation completeness</li>
          </ul>
          <p><strong>Fast response is required to maintain our service quality standards.</strong></p>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #0c5460; margin-top: 0;">📋 Review Checklist</h4>
          <ul>
            <li>Check GitHub repository (if provided)</li>
            <li>Test live URL functionality</li>
            <li>Verify setup instructions</li>
            <li>Review security measures</li>
            <li>Confirm all requirements are met</li>
          </ul>
        </div>
        
        <p>Please log into the admin dashboard to review this submission.</p>
        
        <p>Best regards,<br>
        <strong>BiZy System</strong></p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return html; // Return HTML content for admin emails
};

export const sendProjectCancellationEmailToSeller = async (purchase, seller, project, buyer) => {
  const subject = `❌ Project Submission Cancelled - ${project.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc3545; margin: 0;">❌ Project Submission Cancelled</h1>
        </div>
        
        <p>Dear <strong>${seller.username || seller.Fullname || 'Seller'}</strong>,</p>
        
        <p>We regret to inform you that your project submission for <strong>${project.title}</strong> has been cancelled by our review team.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">📋 Review Feedback</h3>
          <p style="margin-bottom: 0; color: #856404;">
            The requirements you provided do not meet the buyer's expectations. 
            Please review the project requirements carefully and resubmit with updated information.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">📊 Project Details</h3>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Buyer:</strong> ${buyer.username || buyer.Fullname || 'Buyer'}</p>
          <p><strong>Amount:</strong> $${purchase.amount}</p>
          <p><strong>Order ID:</strong> ${purchase._id}</p>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #155724;">🔄 Next Steps</h3>
          <ol style="color: #155724;">
            <li>Review the original project requirements</li>
            <li>Update your submission with more detailed information</li>
            <li>Ensure all required fields are properly filled</li>
            <li>Resubmit the project for review</li>
          </ol>
        </div>
        
        <p>You can resubmit your project by going to your dashboard and updating the project details. 
        Once you resubmit, the project will go back under review.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
          If you have any questions, please contact our support team.
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6c757d; text-align: center;">
          This is an automated message from BiZy Freelancing Platform.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  await sendEmail(seller.email, subject, html);
};

export const sendProjectDeliveryEmailToBuyer = async (purchase, buyer, project, seller) => {
  const subject = `🎉 Your Project is Ready - ${project.title}`;
  
  // Create CSV content
  const csvContent = generateOrderCSV(purchase, project, seller);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">🎉 Your Project is Ready!</h1>
        </div>
        
        <p>Dear <strong>${buyer.username || buyer.Fullname || 'Valued Customer'}</strong>,</p>
        
        <p>Excellent news! Your project <strong>${project.title}</strong> has been successfully delivered and is ready for your use.</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Delivery Confirmation:</h3>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Order ID:</strong> ${purchase._id}</p>
          <p><strong>Amount Paid:</strong> $${purchase.amount}</p>
          <p><strong>Seller:</strong> ${seller.username || seller.Fullname || 'N/A'}</p>
          <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Delivered ✅</span></p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">📋 Project Details & Links</h4>
          ${project.links?.github ? `<p><strong>GitHub Repository:</strong> <a href="${project.links.github}" style="color: #007bff;">${project.links.github}</a></p>` : ''}
          ${project.links?.demo ? `<p><strong>Live Demo:</strong> <a href="${project.links.demo}" style="color: #007bff;">${project.links.demo}</a></p>` : ''}
          ${project.links?.portfolio ? `<p><strong>Portfolio:</strong> <a href="${project.links.portfolio}" style="color: #007bff;">${project.links.portfolio}</a></p>` : ''}
          ${project.links?.documentation ? `<p><strong>Documentation:</strong> <a href="${project.links.documentation}" style="color: #007bff;">${project.links.documentation}</a></p>` : ''}
        </div>
        
        ${purchase.deliveryRequirements ? `
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h4 style="color: #1565c0; margin-top: 0;">🔧 Setup & Deployment Information</h4>
          ${purchase.deliveryRequirements.githubLink ? `<p><strong>GitHub Link:</strong> <a href="${purchase.deliveryRequirements.githubLink}" style="color: #007bff;">${purchase.deliveryRequirements.githubLink}</a></p>` : ''}
          ${purchase.deliveryRequirements.liveUrl ? `<p><strong>Live URL:</strong> <a href="${purchase.deliveryRequirements.liveUrl}" style="color: #007bff;">${purchase.deliveryRequirements.liveUrl}</a></p>` : ''}
          ${purchase.deliveryRequirements.domainName ? `<p><strong>Domain:</strong> ${purchase.deliveryRequirements.domainName}</p>` : ''}
          ${purchase.deliveryRequirements.hostingProvider ? `<p><strong>Hosting Provider:</strong> ${purchase.deliveryRequirements.hostingProvider}</p>` : ''}
          ${purchase.deliveryRequirements.setupInstructions ? `<p><strong>Setup Instructions:</strong> ${purchase.deliveryRequirements.setupInstructions}</p>` : ''}
          ${purchase.deliveryRequirements.featuresImplemented ? `<p><strong>Features Implemented:</strong> ${purchase.deliveryRequirements.featuresImplemented}</p>` : ''}
          ${purchase.deliveryRequirements.technologiesUsed ? `<p><strong>Technologies Used:</strong> ${purchase.deliveryRequirements.technologiesUsed}</p>` : ''}
          ${purchase.deliveryRequirements.deploymentInstructions ? `<p><strong>Deployment Instructions:</strong> ${purchase.deliveryRequirements.deploymentInstructions}</p>` : ''}
          ${purchase.deliveryRequirements.additionalNotes ? `<p><strong>Additional Notes:</strong> ${purchase.deliveryRequirements.additionalNotes}</p>` : ''}
        </div>
        ` : ''}
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #495057; margin-top: 0;">📄 Complete Order Details</h4>
          <p>We've attached a comprehensive CSV file containing all your order details, including:</p>
          <ul>
            <li>Complete project information</li>
            <li>All project links and resources</li>
            <li>Setup and deployment instructions</li>
            <li>Technical specifications</li>
            <li>Contact information</li>
          </ul>
          <p><em>Please save this file for your records.</em></p>
        </div>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h4 style="color: #155724; margin-top: 0;">✅ Next Steps</h4>
          <p>Your project is now ready for use! You can:</p>
          <ul>
            <li>Access your project through the provided links</li>
            <li>Review the setup instructions</li>
            <li>Contact the seller if you need any clarification</li>
            <li>Leave a review once you've tested the project</li>
          </ul>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Thank you for choosing BiZy Freelancing!</p>
        
        <p>Best regards,<br>
        <strong>The BiZy Freelancing Team</strong></p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </div>
  `;
  
  // Send email with CSV attachment
  await sendEmailWithAttachment(buyer.email, subject, html, csvContent, `order-details-${purchase._id}.csv`);
};

// Helper function to generate CSV content
const generateOrderCSV = (purchase, project, seller) => {
  const rows = [
    ['Order Details'],
    ['Order ID', purchase._id],
    ['Project Title', project.title],
    ['Amount Paid', `$${purchase.amount}`],
    ['Purchase Date', new Date(purchase.createdAt).toLocaleDateString()],
    ['Delivery Date', new Date().toLocaleDateString()],
    ['Status', 'Delivered'],
    [''],
    ['Buyer Information'],
    ['Username', purchase.buyer?.username || 'N/A'],
    ['Email', purchase.buyer?.email || 'N/A'],
    [''],
    ['Seller Information'],
    ['Username', seller.username || seller.Fullname || 'N/A'],
    ['Email', seller.email || 'N/A'],
    [''],
    ['Project Links'],
    ['GitHub Repository', project.links?.github || 'N/A'],
    ['Live Demo', project.links?.demo || 'N/A'],
    ['Portfolio', project.links?.portfolio || 'N/A'],
    ['Documentation', project.links?.documentation || 'N/A'],
    [''],
    ['Delivery Requirements'],
    ['GitHub Link', purchase.deliveryRequirements?.githubLink || 'N/A'],
    ['Live URL', purchase.deliveryRequirements?.liveUrl || 'N/A'],
    ['Domain Name', purchase.deliveryRequirements?.domainName || 'N/A'],
    ['Hosting Provider', purchase.deliveryRequirements?.hostingProvider || 'N/A'],
    ['Setup Instructions', purchase.deliveryRequirements?.setupInstructions || 'N/A'],
    ['Features Implemented', purchase.deliveryRequirements?.featuresImplemented || 'N/A'],
    ['Technologies Used', purchase.deliveryRequirements?.technologiesUsed || 'N/A'],
    ['Deployment Instructions', purchase.deliveryRequirements?.deploymentInstructions || 'N/A'],
    ['Additional Notes', purchase.deliveryRequirements?.additionalNotes || 'N/A'],
    [''],
    ['Project Description'],
    ['Description', project.description || 'N/A'],
    ['Category', project.category || 'N/A'],
    ['Price', `$${project.price}` || 'N/A'],
    [''],
    ['Buyer Requirements'],
    ['Requirements', purchase.buyerDescription || 'N/A']
  ];
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

// Helper function to send email with attachment
const sendEmailWithAttachment = async (to, subject, html, csvContent, filename) => {
  try {
    await transporter.sendMail({
      from: '"BiZy Freelancing" <bizy83724@gmail.com>',
      to,
      subject,
      html,
      attachments: [{
        filename,
        content: csvContent,
        contentType: 'text/csv'
      }]
    });
    console.log(`✅ Delivery email with CSV sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('❌ Delivery email sending failed:', err);
  }
};

export const sendProjectDeliveryEarningsEmailToSeller = async (purchase, seller, project, netEarnings, taxAmount) => {
  const subject = `🎉 Congratulations! You've Earned $${netEarnings.toFixed(2)} - ${project.title}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin: 0;">🎉 Congratulations!</h1>
          <h2 style="color: #155724; margin: 10px 0;">Your Project Has Been Delivered!</h2>
        </div>
        
        <p>Dear <strong>${seller.username || seller.Fullname || 'Valued Seller'}</strong>,</p>
        
        <p>Excellent news! Your project <strong>${project.title}</strong> has been successfully delivered and your earnings have been credited to your account.</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">💰 Earnings Summary:</h3>
          <p><strong>Project:</strong> ${project.title}</p>
          <p><strong>Order ID:</strong> ${purchase._id}</p>
          <p><strong>Project Amount:</strong> $${purchase.amount.toFixed(2)}</p>
          <p><strong>Platform Tax (10%):</strong> $${taxAmount.toFixed(2)}</p>
          <p><strong>Net Earnings:</strong> <span style="color: #28a745; font-weight: bold; font-size: 18px;">$${netEarnings.toFixed(2)}</span></p>
          <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">📊 Account Update</h4>
          <p>Your earnings have been automatically added to your account:</p>
          <ul>
            <li><strong>Total Earnings Updated:</strong> $${seller.totalEarnings.toFixed(2)}</li>
            <li><strong>Earning Log Updated:</strong> New entry added with project details</li>
            <li><strong>Available for Withdrawal:</strong> You can now withdraw your earnings</li>
          </ul>
        </div>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h4 style="color: #155724; margin-top: 0;">✅ What's Next?</h4>
          <p>Your project delivery is complete! Here's what you can do next:</p>
          <ul>
            <li>Check your updated earnings in your dashboard</li>
            <li>Withdraw your earnings when ready</li>
            <li>Continue creating and selling more projects</li>
            <li>Build your portfolio and reputation</li>
          </ul>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h4 style="color: #1565c0; margin-top: 0;">💡 Tips for Success</h4>
          <p>Keep up the great work! Here are some tips to maximize your earnings:</p>
          <ul>
            <li>Maintain high-quality project standards</li>
            <li>Respond quickly to buyer inquiries</li>
            <li>Update your portfolio regularly</li>
            <li>Ask satisfied buyers for reviews</li>
          </ul>
        </div>
        
        <p>Thank you for being part of the BiZy Freelancing community!</p>
        
        <p>Best regards,<br>
        <strong>The BiZy Freelancing Team</strong></p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </div>
  `;
  
  await sendEmail(seller.email, subject, html);
};

export { sendEmail };
