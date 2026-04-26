/**
 * @file translations.ts
 * @description Centralized translation strings for the MangoTree application.
 * Provides bilingual support for English (en) and Bulgarian (bg).
 * The `translations` object contains all UI text keyed by language.
 * Use `getTranslation()` to retrieve the appropriate string at runtime.
 */

import type { Language } from "./types";
export type { Language };

/**
 * Complete translation dictionary for both languages.
 * Keys are message identifiers; values are the translated strings.
 *
 * @type {Record<Language, Record<string, string>>}
 */
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // UI Labels
    home: "Home",
    search: "Search",
    upload: "Upload",
    notifications: "Notifications",
    account: "Account",
    settings: "Settings",
    logout: "Logout",
    loading: "Loading...",
    back: "Back",
    cancel: "Cancel",
    confirm: "Confirm",
    goBack: "Go Back",
    no: "No",
    yes: "Yes",
    preview: "Preview",
    ok: "OK",
    retry: "Retry",

    // Auth
    login: "Log in",
    signup: "Sign up",
    username: "Username",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgotten password",
    forgotPasswordTitle: "Password Reset",
    forgotPasswordSubtitle:
      "Enter your email address and we'll send you a link to reset your password.",
    loggingIn: "Logging in...",
    creatingAccount: "Creating account...",
    send: "Send",
    sending: "Sending...",
    sessionExpired: "Session expired",
    successfullyLoggedIn: "Successfully logged in",
    successfullyCreatedAccount: "Successfully created account",
    couldntCreateAccount: "Couldn't create account",
    emailSent: "Email sent",
    serverError: "Server error",
    invalidOrExpiredToken: "Invalid or expired token",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    resetPassword: "Reset Password",
    enterYourUsername: "Enter your username",
    enterYourEmail: "Enter your email",
    enterYourPassword: "Enter your password",
    accountBannedMessage:
      "Your account is banned. Reason: {reason}. Please check your email inbox for more information about your account status and possible next steps.",

    // Validation
    passwordMinLength:
      "Password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character",
    usernameExists: "Username already exists",
    usernameMinLength: "Username must be at least 3 characters long",
    emailMustContain: "Email must contain @ symbol",
    emailNotFound: "No account with this email exists",
    emailExists: "Email already in use",
    incorrectPassword: "Incorrect password",
    invalidPassword:
      "Password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character",
    passwordsDoNotMatch: "Passwords do not match",
    emailCannotBeEdited: "Email cannot be edited",
    passwordCannotBeEdited:
      "Password cannot be edited directly. Use change password button.",
    unableToLoadResetForm:
      "Unable to load password reset form. Please request a new password reset.",

    // User Profile
    memberSince: "Member Since",
    posts: "Posts",
    followers: "Followers",
    following: "Following",
    admins: "Admins",
    noPostsFound: "No posts found in this category",
    noPostsAvailable: "No posts available",
    pageNotFound: "Page not found",
    pleaseWait: "Please wait.",
    goHome: "Go Home",
    pageNotFoundMessage: "The page you're looking for doesn't exist.",
    noFollowersFound: "No followers yet",
    noFollowingFound: "You are not following anyone",
    previousUsernames: "Previous Usernames",
    waitingForApproval: "Waiting for approval",
    bio: "Bio",
    editBio: "Edit Bio",
    saveBio: "Save Bio",
    profilePictureUpdated: "Profile picture updated",
    failedToUpdateProfilePicture: "Failed to update profile picture",
    bioUpdated: "Bio updated successfully",
    failedToUpdateBio: "Failed to update bio",
    deletePost: "Delete Post",
    confirmDeletePost: "Are you sure you want to delete this post?",
    postDeleted: "Post deleted successfully",
    postUpdatedSuccess: "Post updated successfully",
    commentUpdateSuccess: "Comment updated successfully",
    commentUpdateFail: "Comment update failed",
    changeUsername: "Change Username",
    noBio: "No bio set",
    reportUsername: "Report username",
    confirmReportUser: "Are you sure you want to report {username}?",
    viewProfile: "View Profile",
    userProfile: "User Profile",

    // Categories & Tags
    category: "Category",
    tag: "Tag",
    addCategory: "Add Category",
    noCategoriesFound: "No categories found",
    createCategory: "Create Category",
    editCategory: "Edit Category",
    deleteCategory: "Delete Category",
    deleteTag: "Delete Tag",
    editTag: "Edit Tag",
    addTag: "Add Tag",
    createTag: "Create Tag",
    all: "All",
    selectCategory: "Select a category",
    enterCategoryName: "Enter category name (1-50 characters)",
    enterTagName: "Enter tag name (1-20 characters)",
    characters: "characters",
    categoryNameRequired: "Category name is required",
    categoryNameEmpty: "Category name cannot be empty",
    categoryNameTooLong: "Category name cannot be longer than 50 characters",
    categoryCreated: "Category created successfully",
    categoryDeleted: "Category deleted successfully",
    categoryUpdated: "Category updated successfully",
    categoryDeleteFailed: "Failed to delete category",
    categoryUpdateFailed: "Failed to update category",
    deleteCategoryError: "Failed to delete category",
    deleteCategoryWarning:
      "Are you sure you want to delete this category? This action cannot be undone",
    tagNameEmpty: "Tag name cannot be empty",
    tagNameTooLong: "Tag name cannot be longer than 20 characters",
    tagCreated: "Tag created successfully",
    tagDeleted: "Tag deleted successfully",
    tagUpdated: "Tag updated successfully",
    tagUpdateFailed: "Failed to update tag",
    tagCreatedSuccess: "Tag created successfully",
    tagDeletedSuccess: "Tag deleted successfully",
    tagUpdatedSuccess: "Tag updated successfully",
    categoryCreateFailed: "Failed to create category",
    deleteTagWarning:
      "Are you sure you want to delete this tag? This action cannot be undone",
    tagDeleteFailed: "Failed to delete tag",
    noMoreTags: "No more tags available",
    noTagsFound: "No tags found",
    searchTags: "Search tags",
    saveChanges: "Save Changes",
    failedToLoadTags: "Failed to load tags",
    tagCreatedFailed: "Failed to create tag",
    failedToLoadBannedUsers: "Failed to load banned users",
    failedToLoadUsers: "Failed to load users",
    failedToLoadCategories: "Failed to load categories",
    failedToLoadReports: "Failed to load reports",
    failedToLoadFlaggedContent: "Failed to load flagged content",
    failedToLoadUserInfo: "Failed to load user info",
    failedToLoadUserProfile: "Failed to load user profile",

    // Admin
    addAdmin: "Add Admin",
    createAdmin: "Create Admin",
    enterAdminEmail: "Enter admin email",
    adminEmailInfo: "A password setup email will be sent to this address",
    adminAccountCreatedSuccess:
      "Admin account created successfully! Password setup email sent.",
    failedToCreateAdmin: "Failed to create admin",
    failedToLoadAdmins: "Failed to load admins",
    failedToUnbanUser: "Failed to unban user",
    failedLoadUsers: "Failed to load users",
    allUsers: "All Users",
    userNotFound: "User not found",
    banUser: "Ban User",
    ban: "Ban",
    unban: "Unban",
    confirmBan: "Confirm Ban",
    confirmUnban: "Confirm Unban",
    banUserWarning:
      "Are you sure you want to ban {username}? This action will delete all their content and prevent them from logging in. It can be reversed by unbanning the user, but their content will be forever lost.",
    unbanWarning:
      "Are you sure you want to unban {username}? They will regain access to their account",
    unbanUser: "Unban User",
    unbanUserConfirm:
      "Are you sure you want to unban {username}? They will regain access to their account",
    bannedUsers: "Banned Users",
    bannedAt: "Banned At",
    noBannedUsersFound: "No banned users found",
    banned: "Banned",
    userAlreadyBanned: "This user has already been banned.",
    reasonForBan: "Reason for ban",
    reasonForBanPlaceholder: "Enter the reason for banning the user",
    confirmBanText:
      "Are you sure you want to ban {username}? This will ban the user The action is reversible",
    adminUsernameEditDisabled:
      "Your role does not permit you to edit your username. Please reach out to a supervisor",
    adminDeleteAccountDisabled:
      "Your role does not permit you to delete your account. Please reach out to a supervisor",
    adminSettings: "Admin Settings",
    adminSettingsDescription:
      "This page will contain various administrative settings such as global configurations moderation tools etc",
    userBannedSuccessfully: "User {username} banned successfully",
    userUnbannedSuccessfully: "User {username} unbanned successfully",
    noDataLoaded: "No data loaded",
    clickRefreshToLoad: "Click Refresh to load data",

    // Admin Dashboard
    toReview: "To Review",
    reports: "Reports",
    users: "Users",
    tags: "Tags",
    categories: "Categories",
    activityLog: "Activity Logs",

    // Activity Log
    date: "Date",
    action: "Action",
    target: "Target",
    ipAddress: "IP Address",
    searchLogs: "Search logs...",
    filterByAction: "Filter by action",
    allActions: "All",
    startDate: "Start Date",
    endDate: "End Date",
    clearFilters: "Clear Filters",
    noLogsFound: "No logs found",

    // Activity Log Descriptions
    activityLogin: "User logged in",
    activityLogout: "User logged out",
    activityUsernameChange: "Changed username to {username}",
    activityEmailChange: "Changed email to {email}",
    activityProfileImageChange: "Updated profile image",
    activityThemeChange: "Changed theme to {theme}",
    activityLanguageChange: "Changed language to {language}",
    activityBioUpdate: "Updated bio",
    activityPasswordChange: "Changed password",
    activityFollow: "Followed user {username}",
    activityUnfollow: "Unfollowed user {username}",
    activityPostCreate: "Created post: {title}",
    activityPostEdit: "Edited post: {title}",
    activityPostDelete: "Deleted post: {title}",
    activityCommentCreate: "Added comment to post",
    activityCommentEdit: "Edited comment",
    activityCommentDelete: "Deleted comment",
    activityLikePost: "Liked post {id}",
    activityUnlikePost: "Unliked post {id}",
    activityLikeComment: "Liked comment {id}",
    activityUnlikeComment: "Unliked comment {id}",
    activityReportSubmit: "Reported {targetType} {targetId}. Reason: {reason}",
    activityReportResolve: "Report resolved by admin",
    activityContentApprove: "Approved {type} {id}",
    activityContentReject: "Rejected {type} {id}. Reason: {reason}",
    activityBanUser: "Banned user {username}. Reason: {reason}",
    activityUnbanUser: "Unbanned user {username}",
    activity2faEnable: "Enabled two-factor authentication",
    activity2faDisable: "Disabled two-factor authentication",
    activityCategoryCreate: 'Created category "{name}"',
    activityCategoryUpdate: 'Updated category "{name}"',
    activityCategoryDelete: 'Deleted category "{name}"',
    activityTagCreate: 'Created tag "{name}"',
    activityTagUpdate: 'Updated tag "{name}"',
    activityTagDelete: 'Deleted tag "{name}"',
    activityReportStatusUpdate: "Updated report {id} status to {status}",
    activityReportItemDelete: "Deleted reported {targetType} {targetId}",
    activityAccountCreate: "Created account",
    activityAccountDelete: "Deleted account",

    // Security Notifications
    newLoginTitle: "New login detected",
    newLoginMessage: "New login at {time} from {location}",
    newLoginWarning:
      "If this wasn't you, please secure your account immediately.",

    // Reports
    report: "Report",
    reasonForReport: "Reason for report",
    reportSubmitted: "Report submitted successfully",
    reportPost: "Report Post",
    reportComment: "Report Comment",
    reportUser: "Report User",
    enterReportReason: "Please describe why you are reporting this post",
    enterReportReasonComment:
      "Please describe why you are reporting this comment",
    enterReportReasonUser: "Please describe why you are reporting this user",
    cannotReportOwnPost: "You cannot report your own post",
    cannotReportOwnComment: "You cannot report your own comment",
    cannotReportSelf: "You cannot report yourself",
    reportDetails: "Report Details",
    submittedBy: "Submitted by",
    referenceToItem: "Reference to item",
    deleteItem: "Delete Item",
    reasonForDeleting: "Reason for deleting",
    enterReasonForDeletion: "Enter reason for deletion",
    contentType: "Content Type",
    content: "Content",
    reasonDescription: "Reason Description",
    noReports: "No reports submitted",
    noFlaggedContent: "No flagged content to review",
    pleaseProvideReason: "Please provide a reason",
    reportRejectedSuccess: "Report rejected successfully",
    failedToRejectReport: "Failed to reject report",
    itemDeletedSuccess: "Item deleted successfully",
    failedToDeleteItem: "Failed to delete item",
    failedToDeleteUser: "Failed to delete user",
    failedToTranslateContent: "Failed to translate content",
    failedToTranslateComment: "Failed to translate comment",
    contentDetails: "Content Details",
    type: "Type",
    author: "Author",
    reason: "Reason",

    // Comments
    comments: "Comments",
    writeComment: "Write a comment",
    postComment: "Post Comment",
    commentAdded: "Comment added successfully",
    commentCannotBeEmpty: "Comment cannot be empty",
    mustBeLoggedInToComment: "Please log in to leave a comment",
    confirmDeleteComment: "Are you sure you want to delete this comment",

    // Content Approval
    approve: "Approve",
    disapprove: "Disapprove",
    resolve: "Resolve",
    reject: "Reject",
    reasonForRejecting: "Reason for rejecting",
    enterReason: "Enter reason for rejection",
    submitRejection: "Submit Rejection",
    reasonForNotAllowing: "Reason for disapproval",
    enterReasonForDisapproval: "Enter reason for disapproval",
    enterReasonForRejection: "Enter reason for rejection",
    submitDisapproval: "Submit Disapproval",
    contentApprovedSuccess: "Content approved successfully",
    contentDisapprovedSuccess: "Content disapproved successfully",
    pleaseProvideDisapprovalReason: "Please provide a reason for disapproval",
    failedToApproveContent: "Failed to approve content",
    failedToDisapproveContent: "Failed to disapprove content",

    // Notifications
    refresh: "Refresh",
    refreshNotifications: "Refresh notifications",
    markAllAsRead: "Mark all as read",
    clearAll: "Clear all",
    deleteNotification: "Delete notification",
    clearAllConfirm: "Are you sure you want to delete all notifications",
    confirmAction: "Confirm Action",
    allNotificationsCleared: "All notifications cleared",
    notificationDeleted: "Notification deleted",
    failedToDeleteNotification: "Failed to delete notification",
    failedToClearNotifications: "Failed to clear notifications",
    noNotifications: "No notifications yet",
    justNow: "Just now",
    minute: "minute",
    minutes: "minutes",
    hour: "hour",
    hours: "hours",
    day: "day",
    days: "days",
    ago: "ago",

    // Sharing
    share: "Share",
    shareNative: "Native Share",
    copyLink: "Copy Link",
    copied: "Copied!",
    linkCopiedSuccess: "Link copied to clipboard!",
    failedToCopyLink: "Failed to copy link",
    shareEmail: "Share via Email",

    // User Search
    noUsersFound: "No users found",
    noSearchResults: "No content found",

    // Follow System
    follow: "Follow",
    unfollow: "Unfollow",
    followStatusUpdated: "Follow status updated",
    unfollowed: "Unfollowed successfully",
    followed: "Followed successfully",
    successfullyFollowedUser: "Successfully followed user",
    successfullyUnfollowedUser: "Successfully unfollowed user",

    // Account Actions
    deleteAccount: "Delete Account",
    deleteAccountWarning:
      "Are you sure you wish to proceed? Deleting your account is permanent. Your posts and comments will also be terminated.",
    reasonForDeletion: "Reason for deletion",
    reasonForDeletionPlaceholder: "Enter the reason for account termination",
    confirmDeletion: "Confirm Deletion",
    confirmDeletionText:
      "Do you wish to proceed and permanently delete {username}'s account?",
    terminateAccount: "Terminate Account",
    // Admin-specific deletion (more severe warning)
    adminDeleteAccountWarning:
      "Are you sure you want to terminate this user's account? This action is permanent and cannot be undone. All of the user's posts and comments will be permanently deleted.",
    adminReasonForDeletion: "Reason for account termination",
    adminReasonForDeletionPlaceholder:
      "Enter the reason for terminating this user's account",
    adminConfirmDeletion: "Confirm Account Termination",
    adminConfirmDeletionText:
      "Are you sure you want to permanently delete {username}'s account? All their content will be lost.",
    accountDeletedSuccess: "Account deleted successfully",
    accountDeletedSuccessfully: "Account deleted successfully",
    accountDeletedTitle: "Account Deleted",
    accountDeletedBody:
      "Your account has been permanently deleted from MangoTree. This action was taken by an administrator.",
    removeFollower: "Remove Follower",
    confirmRemoveFollower: "Remove Follower",
    confirmRemoveFollowerMessage:
      "Are you sure you want to remove {username} as a follower? They will not be notified",
    followerRemoved: "Follower removed successfully",
    suspensionMessage:
      "Your account is temporarily suspended. Reason: {reason}. Suspension will be lifted on {unbanDate}. Please check your email for more information.",

    // Post Upload
    uploadPost: "Upload a post",
    files: "Files",
    browseFiles: "Browse files",
    supportedFormats:
      "Supported formats: JPEG, PNG, WebP (verified by AI model)",
    title: "Title",
    briefDescription: "Brief description of your upload",
    description: "Description",
    detailedDescription: "Detailed description of what you've uploaded",
    uploading: "Uploading...",
    selectFileError: "Please select at least one file",
    selectCategoryError: "Please select a category",
    enterTitleError: "Please enter a title",
    enterDescriptionError: "Please enter a description",
    filesSkippedError:
      "Some files were skipped Only JPEG, PNG, and WebP formats are supported",
    uploadSuccess:
      "Success Your post is pending for verification You will be notified once it has been approved/disapproved",
    somethingWentWrong: "Something went wrong",

    // Moderation Errors
    postRejectedPrefix: "Post rejected. Reason: {reason}",
    postNotCooking: "Post rejected. Reason: Post is not cooking-related.",
    postInappropriate: "Post rejected. Reason: Content is inappropriate.",
    postAIServerError:
      "Post rejected. Reason: AI server error. Please try again later.",
    postPendingAdminReview:
      "Your post has been submitted and is pending admin review due to AI service limitations.",
    postPublishedSuccess: "Post published successfully!",
    contentFlaggedDuringUpdate: "Content flagged during update",
    postRejected: "Post rejected.",

    // Comment Moderation Errors
    commentRejectedPrefix: "Comment rejected. Reason: {reason}",
    commentInappropriate: "Comment rejected. Reason: Comment is inappropriate.",
    commentAIServerError:
      "Comment rejected. Reason: AI server error. Please try again later.",
    commentRejected: "Comment rejected.",

    // Account Settings
    changePassword: "Change Password",
    appTheme: "App Theme",
    language: "Language",
    rememberMe: "REMEMBER ME",
    onlyJPGE: "Only JPEG, PNG, and WebP formats are supported",
    invalidResetLink: "Invalid reset link Please request a new password reset",
    passwordResetSuccess: "Password reset successful",
    fillAllPasswordFields: "Please fill in all password fields",
    passwordChangedSuccess: "Password changed successfully",
    settingsSavedSuccess: "Settings saved successfully",
    emailUpdatedSuccess:
      "Email updated successfully Please re-verify if required",
    invalidOrMissingToken: "Invalid or missing token",
    passwordSetSuccess: "Password set successfully Redirecting to login",
    passwordResetEmailSent: "Password reset email sent",
    emailMustContainAt: "Email must contain @ symbol",
    unableToEditUsername: "Unable to edit username",
    usernameUpdated: "Username updated successfully",

    // Generic
    actionFailed: "Action failed",
    mustBeLoggedIn: "You must be logged in to perform this action",
    verify: "Verify",

    // Theme & Language
    dark: "Dark",
    light: "Light",
    cream: "Cream",
    purple: "Purple",
    mango: "Mango",
    english: "English",
    bulgarian: "Bulgarian",

    // Post Page
    translate: "Translate",
    translating: "Translating...",
    viewOriginal: "View Original",
    noComments: "No comments yet",
    commentDeleted: "Comment deleted successfully",
    writeReply: "Write a reply...",
    reply: "Reply",
    replyAdded: "Reply added",
    replies: "replies",
    hideReplies: "Hide replies",
    showReplies: "Show replies",
    hide: "hide",
    like: "Like",
    unlike: "Unlike",
    likes: "Likes",
    likeCount: "like", // singular count (e.g., "1 like")
    role: "Role",
    created: "Created",
    actions: "Actions",
    of: "of",
    total: "total",
    hi: "Hi",
    successfullyLoggedOut: "Successfully logged out",
    previous: "Previous",
    next: "Next",
    page: "Page",
    viewPost: "View Post",
    view: "View",

    // User Roles
    adminRole: "Admin",
    userRole: "User",

    // Home Page
    searchResults: "Search Results",
    searchFailed: "Search failed",
    foundPosts: "Found posts",
    failedLoadFeed: "Failed to load feed",
    failedLoadMore: "Failed to load more",
    noMorePosts: "No more posts",
    loadMore: "Load More",
    postsFromFollowed: "Posts from people you follow",
    suggestedForYou: "Suggested for you",
    noSuggestedPosts: "No suggested posts available",
    noFollowedPosts:
      "You're not following anyone yet Follow users to see their posts here",
    welcome: "Welcome",
    welcomeMessage:
      "Follow users to see their posts here or browse suggested content below",

    // System
    close: "Close",
    continue: "Continue",
    edit: "Edit",
    delete: "Delete",
    system: "System",
    added: "Added",
    by: "By",
    question: "Question",
    flex: "Flex",
    recipe: "Recipe",
    post: "Post",
    user: "User",
    comment: "Comment",
    add: "Add",
    editedOn: "Edited on: ",
    edited: "Edited",
    save: "Save",

    // Landing Page
    landingWelcome: "Welcome to MangoTree",
    landingTagline: "Connect, share and grow with a community that matters.",
    landingDescription:
      "MangoTree is a social platform where you can share your recipes, discover new ideas and connect with like-minded people. Join our community today and start your journey.",
    getStarted: "Get Started",
    feature1Title: "Share Your Voice",
    feature1Desc:
      "Create posts, express your way of cooking and let your creativity shine.",
    feature2Title: "Discover Content",
    feature2Desc:
      "Browse through personalized feeds and explore content curated just for you.",
    feature3Title: "Connect & Engage",
    feature3Desc:
      "Follow users, comment on posts and build meaningful connections.",
    landingFooter: "Already have an account? Log in to continue.",

    // 2FA (Two-Factor Authentication)
    twoFactorAuth: "Two-Factor Authentication",
    twoFactorDescription:
      "Add an extra layer of security to your account. When enabled, you'll receive a 6-digit verification code via email each time you log in.",
    twoFactorDisabledDescription: "To disable two-factor authentication, please verify your identity by entering a 6-digit code sent to your email.",
    twoFactorEnabledDescription: "To enable two-factor authentication, please verify your identity by entering a 6-digit code sent to your email.",
    enable2FA: "Enable 2FA",
    disable2FA: "Disable 2FA",
    twoFAEnabled: "2FA is currently enabled",
    twoFADisabled: "2FA is currently disabled",
    send2FACode: "Send verification code",
    verifying2FA: "Verifying...",
    twoFACodeSent: "Verification code sent to your email",
    twoFACodeVerified: "2FA verified successfully",
    failedToSendVerificationCode:
      "Failed to send verification code. Please try again.",
    twoFAEnabledSuccess: "Two-factor authentication enabled successfully",
    twoFADisabledSuccess: "Two-factor authentication disabled successfully",
    twoFACodeLabel: "6-digit code",
    twoFACodePlaceholder: "Enter 6-digit code",
    invalid2FACode: "Invalid or expired code",
    incorrect2FACode: "Incorrect verification code",

    // Copyright
    copyright: "© 2026 MangoTree. All rights reserved.",
  },

  bg: {
    // UI Labels
    home: "Начало",
    search: "Търсене",
    upload: "Качване",
    notifications: "Известия",
    account: "Акаунт",
    settings: "Настройки",
    logout: "Изход",
    loading: "Зареждане...",
    back: "Назад",
    cancel: "Отмяна",
    confirm: "Потвърди",
    goBack: "Назад",
    no: "Не",
    yes: "Да",
    preview: "Преглед",
    ok: "OK",
    retry: "Опитай отново",

    // System
    close: "Затвори",
    continue: "Продължи",
    edit: "Редактирай",
    delete: "Изтрий",
    system: "Система",
    added: "Добавен",
    by: "Създаден от",
    question: "Въпрос",
    flex: "Флекс",
    recipe: "Рецепта",
    post: "Публикация",
    user: "Потребител",
    comment: "Коментар",
    add: "Добави",
    editedOn: "Редактирано на: ",
    edited: "Редактирано",
    save: "Запази",

    // Auth
    login: "Влизане",
    signup: "Регистрация",
    username: "Потребителско име",
    email: "Имейл",
    password: "Парола",
    forgotPassword: "Забравена парола",
    forgotPasswordTitle: "Промяна на парола",
    forgotPasswordSubtitle:
      "Въведете имейл адреса си и ще ви изпратим линк за промяна на паролата.",
    loggingIn: "Влизане...",
    creatingAccount: "Създаване на профил...",
    send: "Изпращане",
    sending: "Изпращане...",
    sessionExpired: "Сесията е изтекла",
    successfullyLoggedIn: "Успешно влязохте",
    successfullyCreatedAccount: "Успешно създадохте профил",
    couldntCreateAccount: "Не беше възможно да се създаде профил",
    emailSent: "Имейлът е изпратен",
    serverError: "Грешка на сървъра",
    invalidOrExpiredToken: "Невалиден или изтекъл токен",
    currentPassword: "Текуща парола",
    newPassword: "Нова парола",
    confirmPassword: "Потвърдете парола",
    resetPassword: "Променете парола",
    enterYourUsername: "Въведете потребителското си име",
    enterYourEmail: "Въведете имейла си",
    enterYourPassword: "Въведете паролата си",
    accountBannedMessage:
      "Вашият акаунт е блокиран. Причина: {reason}. Моля, проверете имейла си за повече информация за статуса на акаунта и възможните следващи стъпки.",

    // Validation
    usernameExists: "Потребителското име вече съществува",
    usernameMinLength: "Потребителското име трябва да е поне 3 символа",
    emailMustContain: "Имейлът трябва да съдържа @ символ",
    emailNotFound: "Не съществува акаунт с този имейл",
    emailExists: "Имейлът вече се използва",
    incorrectPassword: "Грешна парола",
    invalidPassword:
      "Паролата трябва да е поне 8 символа и да съдържа поне една главна буква, една малка буква, една цифра и един специален символ",
    passwordMinLength:
      "Паролата трябва да е поне 8 символа и да съдържа поне една главна буква, една малка буква, едно число и един специален символ",
    passwordsDoNotMatch: "Паролите не съвпадат",
    emailCannotBeEdited: "Имейлът не може да бъде редактиран",
    passwordCannotBeEdited:
      "Паролата не може да бъде променена директно. Използвайте бутона за промяна на парола.",
    unableToLoadResetForm:
      "Неуспешно зареждане на формата за промяна на парола. Моля, поискайте нова промяна на паролата.",

    // User Profile
    memberSince: "Член от",
    posts: "Публикации",
    followers: "Последователи",
    following: "Следвани",
    admins: "Администратори",
    noPostsFound: "Няма публикации в тази категория",
    noPostsAvailable: "Няма публикации",
    pageNotFound: "Страницата не е намерена",
    pleaseWait: "Моля, изчакайте.",
    goHome: "Към началната страница",
    pageNotFoundMessage: "Страницата, която търсите, не съществува.",
    noFollowersFound: "Все още няма последователи",
    noFollowingFound: "Не следвате никого",
    previousUsernames: "Предишни потребителски имена",
    waitingForApproval: "Чака за одобрение",
    bio: "Биография",
    editBio: "Редактиране на биография",
    saveBio: "Запазете биография",
    profilePictureUpdated: "Профилната снимка беше обновена",
    failedToUpdateProfilePicture: "Неуспешно обновяване на профилната снимка",
    bioUpdated: "Биографията беше обновена успешно",
    failedToUpdateBio: "Неуспешно обновяване на биографията",
    deletePost: "Изтриване",
    confirmDeletePost: "Сигурни ли сте, че искате да изтриете тази публикация?",
    postDeleted: "Публикацията беше изтрита успешно",
    postUpdatedSuccess: "Публикацията беше обновена успешно",
    commentUpdateSuccess: "Коментарът беше обновен успешно",
    commentUpdateFail: "Неуспешно обновяване на коментар",
    changeUsername: "Промяна на потребителско име",
    usernameUpdated: "Потребителското име беше обновено успешно",
    noBio: "Няма зададена биография",
    reportUsername: "Докладване на потребител",
    confirmReportUser: "Сигурни ли сте, че искате да докладвате {username}?",
    viewProfile: "Виж профил",
    userProfile: "Профил на потребител",

    // Categories & Tags
    category: "Категория",
    tag: "Таг",
    addCategory: "Добави категория",
    noCategoriesFound: "Няма намерени категории",
    createCategory: "Създай категория",
    editCategory: "Редактирай категория",
    deleteCategory: "Изтрий категория",
    deleteTag: "Изтрий таг",
    editTag: "Редактирай таг",
    addTag: "Добави таг",
    createTag: "Създай таг",
    all: "Всички",
    selectCategory: "Избери категория",
    enterCategoryName: "Въведете име на категория (1-50 символа)",
    enterTagName: "Въведете име на таг (1-20 символа)",
    characters: "символа",
    categoryNameRequired: "Името на категорията е задължително",
    categoryNameEmpty: "Името на категорията не може да е празно",
    categoryNameTooLong:
      "Името на категорията не може да е по-дълго от 50 символа",
    categoryCreated: "Категорията е създадена успешно",
    categoryDeleted: "Категорията е изтрита успешно",
    categoryUpdated: "Категорията е обновена успешно",
    categoryDeleteFailed: "Неуспешно изтриване на категория",
    categoryUpdateFailed: "Неуспешно обновяване на категория",
    deleteCategoryError: "Неуспешно изтриване на категория",
    deleteCategoryWarning:
      "Сигурни ли сте, че искате да изтриете тази категория? Това действие е необратимо",
    tagNameEmpty: "Името на тага не може да е празно",
    tagNameTooLong: "Името на тага не може да е по-дълго от 20 символа",
    tagCreated: "Тагът е създаден успешно",
    tagDeleted: "Тагът е изтрит успешно",
    tagUpdated: "Тагът е обновен успешно",
    tagUpdateFailed: "Неуспешно обновяване на таг",
    tagCreatedSuccess: "Тагът е създаден успешно",
    tagDeletedSuccess: "Тагът е изтрит успешно",
    tagUpdatedSuccess: "Тагът е обновен успешно",
    categoryCreateFailed: "Неуспешно създаване на категория",
    deleteTagWarning:
      "Сигурни ли сте, че искате да изтриете този таг? Това действие е необратимо",
    tagDeleteFailed: "Неуспешно изтриване на таг",
    noMoreTags: "Няма повече налични тагове",
    noTagsFound: "Няма намерени тагове",
    searchTags: "Търсене на тагове",
    saveChanges: "Запазване на промените",
    failedToLoadTags: "Неуспешно зареждане на тагове",
    tagCreatedFailed: "Неуспешно създаване на таг",
    failedToLoadBannedUsers: "Неуспешно зареждане на забранени потребители",
    failedToLoadUsers: "Неуспешно зареждане на потребители",
    failedToLoadCategories: "Неуспешно зареждане на категории",
    failedToLoadReports: "Неуспешно зареждане на доклади",
    failedToLoadFlaggedContent: "Неуспешно зареждане на маркирано съдържание",
    failedToLoadUserInfo: "Неуспешно зареждане на информация за потребител",
    failedToLoadUserProfile: "Неуспешно зареждане на профил на потребител",

    // Admin
    addAdmin: "Добавяне на администратор",
    createAdmin: "Създаване на администратор",
    enterAdminEmail: "Въведете имейл на администратор",
    adminEmailInfo:
      "Имейл за създаване на парола ще бъде изпратен на този адрес",
    adminAccountCreatedSuccess:
      "Администраторски акаунт създаден успешно! Имейл за настройка на парола изпратен.",
    failedToCreateAdmin: "Неуспешно създаване на администратор",
    failedToLoadAdmins: "Неуспешно зареждане на администратори",
    failedToUnbanUser: "Неуспешно разблокиране на потребител",
    allUsers: "Всички потребители",
    userNotFound: "Потребителят не е намерен",
    banUser: "Блокиране на потребител",
    ban: "Блокирай",
    unban: "Отблокирай",
    confirmBan: "Потвърди блокиране",
    confirmUnban: "Потвърди отзблокиране",
    banUserWarning:
      "Сигурни ли сте, че искате да блокирате {username}? Това действие ще изтрие цялото му съдържание и ще премахне достъпа му до системата. Изтриването може да бъде отменено чрез отблокиране на потребителя, но съдържанието няма да бъде възстановено.",
    unbanWarning:
      "Сигурни ли сте, че искате да отблокирате {username}? Те ще възстановят достъп до акаунта си",
    unbanUser: "Отзблокирай потребител",
    unbanUserConfirm:
      "Сигурни ли сте, че искате да отблокирате {username}? Те ще възстановят достъп до акаунта си",
    bannedUsers: "Блокирани потребители",
    bannedAt: "Блокиран на",
    noBannedUsersFound: "Няма блокирани потребители",
    banned: "Блокиран",
    userAlreadyBanned: "Този потребител вече е блокиран.",
    reasonForBan: "Причина за блокиране",
    reasonForBanPlaceholder: "Въведете причината за блокиране",
    confirmBanText:
      "Сигурни ли сте, че искате да блокирате {username}? Това ще блокира потребителя. Действието може да бъде върнато",
    adminUsernameEditDisabled:
      "Вашата роля не ви позволява да редактирате потребителското си име.",
    adminDeleteAccountDisabled:
      "Вашата роля не ви позволява да изтриете акаунта си.",
    adminSettings: "Администраторски настройки",
    adminSettingsPlaceholder: "Настройки на администратора",
    adminSettingsDescription:
      "Тази страница съдържа административни и модераторски настройки",
    userBannedSuccessfully: "Потребителят {username} е блокиран успешно",
    userUnbannedSuccessfully: "Потребителят {username} е отблокиран успешно",
    noDataLoaded: "Няма заредени данни",
    clickRefreshToLoad: "Натиснете Обнови, за да заредите данни",
    unableToEditUsername:
      "Вашата роля не ви позволява да редактирате потребителското си име.",

    // Admin Dashboard
    toReview: "За преглед",
    reports: "Доклади",
    users: "Потребители",
    tags: "Тагове",
    categories: "Категории",
    activityLog: "Дейности",

    // Activity Log
    date: "Дата",
    action: "Действие",
    target: "Цел",
    ipAddress: "IP адрес",
    searchLogs: "Търсене в журнала...",
    filterByAction: "Филтриране по действие",
    allActions: "Всички",
    startDate: "Начална дата",
    endDate: "Крайна дата",
    clearFilters: "Изчисти филтри",
    noLogsFound: "Няма намерени записи",

    // Activity Log Descriptions
    activityLogin: "Потребителят влезе в системата",
    activityLogout: "Потребителят излезе от системата",
    activityUsernameChange: "Променено потребителско име на {username}",
    activityEmailChange: "Променен имейл на {email}",
    activityProfileImageChange: "Обновена профилна снимка",
    activityThemeChange: "Променена тема на {theme}",
    activityLanguageChange: "Променен език на {language}",
    activityBioUpdate: "Обновена биография",
    activityPasswordChange: "Променена парола",
    activityFollow: "Започна да следва потребител {username}",
    activityUnfollow: "Спря да последовател на потребител {username}",
    activityPostCreate: "Създадена публикация: {title}",
    activityPostEdit: "Редактирана публикация: {title}",
    activityPostDelete: "Изтрита публикация: {title}",
    activityCommentCreate: "Добавен коментар към публикация",
    activityCommentEdit: "Редактиран коментар",
    activityCommentDelete: "Изтрит коментар",
    activityLikePost: "Хареса публикация {id}",
    activityUnlikePost: "Премахнато харесване на публикация {id}",
    activityLikeComment: "Хареса коментар {id}",
    activityUnlikeComment: "Премахнато харесване на коментар {id}",
    activityReportSubmit:
      "Докладвано {targetType} {targetId}. Причина: {reason}",
    activityReportResolve: "Докладът беше разрешен от администратор",
    activityContentApprove: "Одобрен(а) {type} {id}",
    activityContentReject: "Отхвърлен(а) {type} {id}. Причина: {reason}",
    activityBanUser: "Блокиран потребител {username}. Причина: {reason}",
    activityUnbanUser: "Разблокиран потребител {username}",
    activity2faEnable: "Включена двуфакторна автентикация",
    activity2faDisable: "Изключена двуфакторна автентикация",
    activityCategoryCreate: 'Създадена категория "{name}"',
    activityCategoryUpdate: 'Обновена категория "{name}"',
    activityCategoryDelete: 'Изтрита категория "{name}"',
    activityTagCreate: 'Създаден таг "{name}"',
    activityTagUpdate: 'Обновен таг "{name}"',
    activityTagDelete: 'Изтрит таг "{name}"',
    activityReportStatusUpdate: "Обновен статус на доклад {id} на {status}",
    activityReportItemDelete: "Изтрит докобан {targetType} {targetId}",
    activityAccountCreation: "Потребителски акаунт създаден",
    activityAccountDeletion: "Потребителски акаунт изтрит",

    // Security Notifications
    newLoginTitle: "Открито ново влизане",
    newLoginMessage: "Ново влизане в {time} от {location}",
    newLoginWarning: "Ако това не сте вие, моля незабавно защитете акаунта си.",

    // Reports
    report: "Доклад",
    reasonForReport: "Причина за доклад",
    reportSubmitted: "Докладът беше изпратен успешно",
    reportPost: "Докладвай публикация",
    reportComment: "Докладвай коментар",
    reportUser: "Докладвай потребител",
    enterReportReason: "Моля, опишете защо докладвате тази публикация",
    enterReportReasonComment: "Моля, опишете защо докладвате този коментар",
    enterReportReasonUser: "Моля, опишете защо докладвате този потребител",
    cannotReportOwnPost: "Не можете да докладвате собствена публикация",
    cannotReportOwnComment: "Не можете да докладвате собствен коментар",
    cannotReportSelf: "Не можете да се докладвате себе си",
    reportDetails: "Подробности за доклада",
    submittedBy: "Подадено от",
    referenceToItem: "Препратка към елемента",
    deleteItem: "Изтрий елемент",
    reasonForDeleting: "Причина за изтриване",
    enterReasonForDeletion: "Въведете причина за изтриване...",
    contentType: "Тип съдържание",
    content: "Съдържание",
    reasonDescription: "Описание на причината",
    noReports: "Няма подадени доклади",
    noFlaggedContent: "Няма съдържание за преглед",
    pleaseProvideReason: "Моля, предоставете причина",
    reportRejectedSuccess: "Докладът беше отхвърлен успешно",
    failedToRejectReport: "Неуспешно отхвърляне на доклад",
    itemDeletedSuccess: "Елементът беше изтрит успешно",
    failedToDeleteItem: "Неуспешно изтриване на елемент",
    failedToDeleteUser: "Неуспешно изтриване на потребител",
    failedToTranslateContent: "Неуспешно превеждане на съдържание",
    failedToTranslateComment: "Неуспешно превеждане на коментар",
    contentDetails: "Детайли за съдържанието",
    type: "Тип",
    author: "Автор",
    reason: "Причина",

    // Comments
    comments: "Коментари",
    writeComment: "Напишете коментар",
    postComment: "Публикувайте коментар",
    commentAdded: "Коментарът беше добавен успешно",
    commentCannotBeEmpty: "Коментарът не може да бъде празен",
    mustBeLoggedInToComment:
      "Моля, влезте в системата, за да оставите коментар",
    confirmDeleteComment:
      "Сигурни ли сте, че искате да изтриете този коментар?",

    // Content Approval
    approve: "Одобри",
    disapprove: "Отхвърли",
    resolve: "Разреши",
    reject: "Отхвърли",
    reasonForRejecting: "Причина за отхвърляне",
    enterReason: "Въведете причина за отхвърляне",
    submitRejection: "Изпратете отхвърляне",
    reasonForNotAllowing: "Причина за отхвърляне",
    enterReasonForDisapproval: "Въведете причина за отхвърляне",
    enterReasonForRejection: "Въведете причина за отхвърляне",
    submitDisapproval: "Изпратете отхвърляне",
    contentApprovedSuccess: "Съдържанието е одобрено успешно",
    contentDisapprovedSuccess: "Съдържанието е отхвърлено успешно",
    pleaseProvideDisapprovalReason: "Моля, въведете причина за отхвърляне",
    failedToApproveContent: "Неуспешно одобряване на съдържание",
    failedToDisapproveContent: "Неуспешно отхвърляне на съдържание",

    // Notifications
    refresh: "Обнови",
    refreshNotifications: "Обнови известията",
    markAllAsRead: "Отбележи всички като прочетени",
    clearAll: "Изчисти всички",
    deleteNotification: "Изтрий известие",
    clearAllConfirm: "Сигурни ли сте, че искате да изтриете всички известия?",
    confirmAction: "Потвърди действие",
    allNotificationsCleared: "Всички известия са изчистени",
    notificationDeleted: "Известието е изтрито",
    failedToDeleteNotification: "Неуспешно изтриване на известие",
    failedToClearNotifications: "Неуспешно изчистване на известия",
    noNotifications: "Няма известия все още",
    justNow: "Току-що",
    minute: "минута",
    minutes: "минути",
    hour: "час",
    hours: "часа",
    day: "ден",
    days: "дни",
    ago: "преди",

    // Sharing
    share: "Споделяне",
    shareNative: "Сподели",
    copyLink: "Копирай линк",
    copied: "Копирано!",
    linkCopiedSuccess: "Линкът е копиран в клипборда!",
    failedToCopyLink: "Неуспешно копиране на линк",
    shareEmail: "Сподели чрез имейл",

    // User Search
    noUsersFound: "Няма намерени потребители",
    noSearchResults: "Няма намерено съдържание",

    // Follow System
    follow: "Следвай",
    unfollow: "Отпоследвай",
    followStatusUpdated: "Статусът на следване е актуализиран",
    unfollowed: "Успешно отпоследвахте",
    followed: "Успешно последвахте",
    successfullyFollowedUser: "Успешно последвахте потребителя",
    successfullyUnfollowedUser: "Успешно премахнахте следването на потребителя",

    // Follower Actions
    removeFollower: "Премахни последовател",
    confirmRemoveFollower: "Премахни последовател",
    confirmRemoveFollowerMessage:
      "Сигурни ли сте, че искате да премахнете {username} от последователите? Потребителят няма да бъде уведомен",
    followerRemoved: "Последователят беше премахнат успешно",

    // Account Actions
    deleteAccount: "Изтрий акаунт",
    reasonForDeletion: "Причина за изтриване",
    confirmDeletion: "Потвърди изтриване",
    terminateAccount: "Прекрати акаунт",
    deleteAccountWarning:
      "Сигурни ли сте, че искате да продължите? Изтриването на акаунта е перманентно. Вашите публикации и коментари също ще бъдат изтрити?",
    reasonForDeletionPlaceholder:
      "Въведете причината за прекратяване на акаунта",
    confirmDeletionText:
      "Желаете ли да продължите и да изтриете акаунта на {username} завинаги",
    // Admin-specific deletion (more severe warning)
    adminDeleteAccountWarning:
      "Сигурни ли сте, че искате да прекратите акаунта на този потребител? Това действие е перманентно и не може да бъде отменено. Всички публикации и коментари на потребителя ще бъдат изтрити завинаги.",
    adminReasonForDeletion: "Причина за прекратяване на акаунта",
    adminReasonForDeletionPlaceholder:
      "Въведете причината за прекратяването на акаунта на потребителя",
    adminConfirmDeletion: "Потвърди прекратяване на акаунт",
    adminConfirmDeletionText:
      "Сигурни ли сте, че искате да изтриете завинаги акаунта на {username}? Цялото им съдържание ще бъде загубено.",
    accountDeletedTitle: "Акаунтът е изтрит",
    accountDeletedBody:
      "Вашият акаунт беше перманентно изтрит от MangoTree. Това действие беше направено от администратор.",
    accountDeletedSuccessfully: "Акаунтът е изтрит успешно",
    suspensionMessage:
      "Вашият акаунт е временно блокиран. Причина: {reason}. Блокировката ще бъде отменена на {unbanDate}. Моля, проверете имейла си за повече информация.",

    // Post Upload
    uploadPost: "Качване на публикация",
    files: "Файлове",
    browseFiles: "Преглед на файлове",
    supportedFormats:
      "Поддържани формати: JPEG, PNG, WebP (проверени от AI модел)",
    title: "Заглавие",
    briefDescription: "Кратко описание",
    description: "Описание",
    detailedDescription: "Подробно описание на това, което сте качили",
    uploading: "Качване...",
    selectFileError: "Моля, изберете поне един файл",
    selectCategoryError: "Моля, изберете категория",
    enterTitleError: "Моля, въведете заглавие",
    enterDescriptionError: "Моля, въведете описание",
    filesSkippedError:
      "Някои файлове бяха пропуснати. Поддържат се само JPEG, PNG и WebP формати",
    uploadSuccess:
      "Успех! Вашата публикация изчаква проверка. Ще бъдете уведомени, когато бъде одобрена/отхвърлена",
    somethingWentWrong: "Нещо се обърка",

    // Moderation Errors
    postRejectedPrefix: "Публикацията е отхвърлена. Причина: {reason}",
    postNotCooking:
      "Публикацията е отхвърлена. Причина: Публикацията не е свързана с готвене.",
    postInappropriate:
      "Публикацията е отхвърлена. Причина: Съдържанието е неуместно.",
    postAIServerError:
      "Публикацията е отхвърлена. Причина: Грешка в AI сървъра. Моля, опитайте по-късно.",
    postPendingAdminReview:
      "Публикацията ви беше изпратена и чака одобрение от администратор поради ограничения в AI услугата.",
    postPublishedSuccess: "Публикацията беше публикувана успешно!",
    contentFlaggedDuringUpdate: "Съдържанието беше отбелязано при актуализация",
    postRejected: "Публикацията е отхвърлена.",

    // Comment Moderation Errors
    commentRejectedPrefix: "Коментарът е отхвърлен. Причина: {reason}",
    commentInappropriate:
      "Коментарът е отхвърлен. Причина: Коментарът е неуместен.",
    commentAIServerError:
      "Коментарът е отхвърлен. Причина: Грешка в AI сървъра. Моля, опитайте по-късно.",
    commentRejected: "Коментарът е отхвърлен.",

    // Account Settings
    changePassword: "Промени парола",
    appTheme: "Тема на приложението",
    language: "Език",
    rememberMe: "ЗАПОМНИ МЕ",
    onlyJPGE: "Поддържат се само JPEG, PNG и WebP формати",
    invalidResetLink:
      "Невалиден линк за нулиране на парола. Моля, изпратете нова заявка за нулиране на парола",
    passwordResetSuccess: "Паролата е нулирана успешно",
    fillAllPasswordFields: "Моля, попълнете всички полета за парола",
    passwordChangedSuccess: "Паролата е променена успешно",
    settingsSavedSuccess: "Настройките са запазени успешно",
    emailUpdatedSuccess:
      "Имейлът е обновен успешно. Моля, проверете отново ако е необходимо",
    invalidOrMissingToken: "Невалиден или липсващ токен",
    passwordSetSuccess: "Паролата е зададена успешно. Пренасочване към входа",
    passwordResetEmailSent: "Имейлът за нулиране на парола е изпратен",
    emailMustContainAt: "Имейлът трябва да съдържа @ символ",

    // Users
    accountDeletedSuccess: "Акаунтът беше изтрит успешно",

    // Theme
    dark: "Тъмна",
    light: "Светла",
    cream: "Кремава",
    purple: "Лилава",
    mango: "Манго",
    english: "Английски",
    bulgarian: "Български",

    // Post Page
    translate: "Преведи",
    translating: "Превеждане...",
    viewOriginal: "Виж оригинала",
    noComments: "Няма коментари все още",
    commentDeleted: "Коментарът беше изтрит успешно",
    writeReply: "Напишете отговор...",
    reply: "Отговори",
    replyAdded: "Отговорът беше добавен",
    replies: "отговора",
    hideReplies: "Скрий отговорите",
    showReplies: "Покажи отговорите",
    hide: "скрий",
    like: "Харесай",
    unlike: "Отхаресай",
    likes: "Харесвания",
    likeCount: "харесване",
    role: "Роля",
    created: "Създаден на",
    actions: "Действия",
    of: "от",
    total: "общо",
    hi: "Здравей",
    successfullyLoggedOut: "Успешно излязохте",
    previous: "Предишна",
    next: "Следваща",
    page: "Страница",
    viewPost: "Виж публикацията",
    view: "Виж",

    // User Roles
    adminRole: "Администратор",
    userRole: "Потребител",

    // Home Page
    searchResults: "Резултати от търсене",
    searchFailed: "Търсенето не беше успешно",
    foundPosts: "Намерени публикации",
    failedLoadFeed: "Неуспешно зареждане на съдържание",
    failedLoadMore: "Неуспешно зареждане на още",
    noMorePosts: "Няма повече публикации",
    loadMore: "Зареди още",
    postsFromFollowed: "Публикации от хора, които следваш",
    suggestedForYou: "Препоръчани за теб",
    noSuggestedPosts: "Няма препоръчани публикации",
    noFollowedPosts:
      "Все още не следвате никого. Следвайте потребители, за да видите техните публикации тук",
    welcome: "Добре дошли",
    welcomeMessage:
      "Следвайте потребители, за да видите техните публикации тук или разгледайте препоръчаното съдържание по-долу",

    // Generic
    actionFailed: "Действието не беше успешно",
    mustBeLoggedIn:
      "Трябва да сте влезли в системата, за да извършите това действие",
    verify: "Потвърди",

    // Generic errors
    failedLoadTags: "Неуспешно зареждане на тагове",
    failedCreateTag: "Неуспешно създаване на таг",
    failedDeleteTag: "Неуспешно изтриване на таг",
    failedUpdateTag: "Неуспешно обновяване на таг",
    failedLoadUsers: "Неуспешно зареждане на потребители",
    failedDeleteUser: "Неуспешно изтриване на потребител",
    failedCreateAdmin: "Неуспешно създаване на администратор",

    // Landing Page
    landingWelcome: "Добре дошли в MangoTree",
    landingTagline: "Свързвайте се, споделяйте и растете с общност, която има значение.",
    landingDescription: "MangoTree е социална платформа, където можете да споделяте своите рецепти, да откривате нови идеи и да се свързвате с хора със сходни интереси. Присъединете се към нашата общност днес и започнете вашето пътешествие.",
    getStarted: "Започнете",
    feature1Title: "Споделете гласа си",
    feature1Desc: "Създавайте публикации, изразете своя стил на готвене и оставете креативността си да блесне.",
    feature2Title: "Откривайте съдържание",
    feature2Desc: "Разглеждайте персонализирани новини и изследвайте съдържание, подбрано специално за вас.",
    feature3Title: "Свързвайте се и общувайте",
    feature3Desc: "Последвайте потребители, коментирайте публикации и изграждайте смислени връзки.",
    landingFooter: "Вече имате профил? Влезте, за да продължите.",

    // 2FA (Two-Factor Authentication)
    twoFactorAuth: "Двуфакторна автентикация",
    twoFactorDescription:
      "Добавете допълнителен слой сигурност към акаунта си. Когато е активирана, ще получавате 6-цифрен код на имейл при всяко влизане.",
    twoFactorEnabledDescription: "За да активирате двуфакторната автентикация, моля, въведете 6-цифрен код, изпратен на вашия имейл.",
    twoFactorDisabledDescription: "За да деактивирате двуфакторната автентикация, моля, въведете 6-цифрен код, изпратен на вашия имейл.",
    enable2FA: "Активирай 2FA",
    disable2FA: "Деактивирай 2FA",
    twoFAEnabled: "2FA е активирана",
    twoFADisabled: "2FA е деактивирана",
    send2FACode: "Изпрати код за потвърждение",
    verifying2FA: "Потвърждаване...",
    twoFACodeSent: "Код за потвърждение изпратен на имейла",
    twoFACodeVerified: "2FA потвърдена успешно",
    failedToSendVerificationCode:
      "Неуспешно изпращане на код за верификация. Моля, опитайте отново.",
    twoFAEnabledSuccess: "Двуфакторната автентикация е активирана успешно",
    twoFADisabledSuccess: "Двуфакторната автентикация е деактивирана успешно",
    twoFACodeLabel: "6-цифрен код",
    twoFACodePlaceholder: "Въведете 6-цифрен код",
    invalid2FACode: "Невалиден или изтекъл код",
    incorrect2FACode: "Неверен код за потвърждение",

    // Copyright
    copyright: "© 2026 MangoTree. Всички права запазени.",
  },
};

/**
 * Get the translated string for a given language and key.
 * Falls back to the key itself if translation is missing.
 *
 * @function getTranslation
 * @param {Language} language - Target language ('en' or 'bg')
 * @param {string} key - Translation key (must exist in the dictionary)
 * @param {Record<string, string>} params - Optional parameters for interpolation
 * @returns {string} The translated string with parameters replaced, or the key if not found
 */
export const getTranslation = (
  language: Language,
  key: string,
  params?: Record<string, string>,
): string => {
  const translation = translations[language][key] || key;

  if (!params) return translation;

  // Replace placeholders like {paramName} with their values
  return translation.replace(/\{(\w+)\}/g, (match, paramName) => {
    return params[paramName] !== undefined ? params[paramName] : match;
  });
};
