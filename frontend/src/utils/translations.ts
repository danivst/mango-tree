export type Language = "en" | "bg";

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

    // Auth
    login: "Log in",
    signin: "Sign in",
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
      "Password must be at least 8 characters long, and must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    usernameExists: "Username already exists",
    usernameMinLength: "Username must be at least 3 characters long",
    emailMustContain: "Email must contain @ symbol",
    emailNotFound: "No account with this email exists",
    incorrectPassword: "Incorrect password",
    invalidPassword: "Password must meet the requirements",
    passwordsDoNotMatch: "Passwords do not match",
    emailCannotBeEdited: "Email cannot be edited",

    // User Profile
    memberSince: "Member Since",
    posts: "Posts",
    followers: "Followers",
    following: "Following",
    admins: "Admins",
    noPostsFound: "No posts found in this category",
    noFollowersFound: "No followers yet",
    noFollowingFound: "You are not following anyone",
    waitingForApproval: "Waiting for approval",
    bio: "Bio",
    editBio: "Edit Bio",
    saveBio: "Save Bio",
    profilePictureUpdated: "Profile picture updated",
    changeUsername: "Change Username",
    noBio: "No bio set",
    reportUsername: "Report username",
    confirmReportUser: "Are you sure you want to report {username}",
    viewProfile: "View Profile",
    userProfile: "User Profile",

    // Categories & Tags
    category: "Category",
    tag: "Tag",
    addCategory: "Add Category",
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
    categoryNameEmpty: "Category name cannot be empty",
    categoryNameTooLong: "Category name cannot be longer than 50 characters",
    categoryCreated: "Category created successfully",
    categoryDeleted: "Category deleted successfully",
    categoryUpdated: "Category updated successfully",
    categoryDeleteFailed: "Failed to delete category",
    categoryUpdateFailed: "Failed to update category",
    deleteCategoryError: "Failed to delete category",
    tagNameEmpty: "Tag name cannot be empty",
    tagNameTooLong: "Tag name cannot be longer than 20 characters",
    tagCreated: "Tag created successfully",
    tagDeleted: "Tag deleted successfully",
    tagUpdated: "Tag updated successfully",
    tagUpdateFailed: "Failed to update tag",
    tagCreatedSuccess: "Tag created successfully",
    tagDeletedSuccess: "Tag deleted successfully",
    tagUpdatedSuccess: "Tag updated successfully",
    deleteTagWarning:
      "Are you sure you want to delete this tag? This action cannot be undone",
    saveChanges: "Save Changes",

    // Admin
    addAdmin: "Add Admin",
    createAdmin: "Create Admin",
    enterAdminEmail: "Enter admin email",
    adminEmailInfo: "A password setup email will be sent to this address",
    adminAccountCreatedSuccess:
      "Admin account created successfully! Password setup email sent.",
    failedToCreateAdmin: "Failed to create admin",
    allUsers: "All Users",
    userNotFound: "User not found",
    banUser: "Ban User",
    ban: "Ban",
    unban: "Unban",
    confirmBan: "Confirm Ban",
    confirmUnban: "Confirm Unban",
    banUserWarning:
      "Are you sure you want to ban {username}? This action will delete all their content and prevent them from logging in It can be reversed by unbanning the user",
    unbanWarning:
      "Are you sure you want to unban {username}? They will regain access to their account",
    unbanUser: "Unban User",
    unbanUserConfirm:
      "Are you sure you want to unban {username}? They will regain access to their account",
    bannedUsers: "Banned Users",
    bannedAt: "Banned At",
    noBannedUsersFound: "No banned users found",
    banned: "Banned",
    reasonForBan: "Reason for ban",
    reasonForBanPlaceholder: "Enter the reason for banning the user",
    confirmBanText:
      "Are you sure you want to ban {username}? This will ban the user The action is reversible",
    adminUsernameEditDisabled:
      "Your role does not permit you to edit your username Please reach out to a supervisor",
    adminDeleteAccountDisabled:
      "Your role does not permit you to delete your account Please reach out to a supervisor",
    adminSettings: "Admin Settings",
    adminSettingsPlaceholder: "Admin Settings Placeholder",
    adminSettingsDescription:
      "This page will contain various administrative settings such as global configurations moderation tools etc",

    // Admin Dashboard
    toReview: "To Review",
    reports: "Reports",
    users: "Users",
    tags: "Tags",
    categories: "Categories",

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
    contentDetails: "Content Details",
    type: "Type",
    author: "Author",

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

    // User Search
    noUsersFound: "No users found",
    noSearchResults: "No users match your search",

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
      "Are you sure you wish to proceed? Deleting your account is permanent. Your posts and comments will also be terminated?",
    reasonForDeletion: "Reason for deletion",
    reasonForDeletionPlaceholder: "Enter the reason for account termination",
    confirmDeletion: "Confirm Deletion",
    confirmDeletionText:
      "Do you wish to proceed and permanently delete {username}'s account",
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

    // Post Upload
    uploadPost: "Upload a post",
    files: "Files",
    browseFiles: "Browse Files",
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

    // Generic
    actionFailed: "Action failed",
    mustBeLoggedIn: "You must be logged in to perform this action",

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
    viewOriginal: "View Original",
    noComments: "No comments yet",
    commentDeleted: "Comment deleted successfully",
    like: "Like",
    likes: "Likes",
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

    // Landing Page
    landingWelcome: "Welcome to MangoTree",
    landingTagline: "Connect, share, and grow with a community that matters.",
    landingDescription:
      "MangoTree is a social platform where you can share your thoughts, discover new content, and connect with like-minded people. Join our community today and start your journey.",
    getStarted: "Get Started",
    feature1Title: "Share Your Voice",
    feature1Desc:
      "Create posts, express your ideas, and let your creativity shine.",
    feature2Title: "Discover Content",
    feature2Desc:
      "Browse through personalized feeds and explore content curated just for you.",
    feature3Title: "Connect & Engage",
    feature3Desc:
      "Follow users, comment on posts, and build meaningful connections.",
    landingFooter: "Already have an account? Log in to continue.",
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

    // System
    close: "Затвори",
    continue: "Продължи",
    edit: "Редактирай",
    delete: "Изтрий",
    system: "Система",
    added: "Добавен",
    by: "Създаден от",
    question: "Въпрос",
    flex: "Гъвкав",
    recipe: "Рецепта",
    post: "Публикация",
    user: "Потребител",
    comment: "Коментар",

    // Auth
    login: "Влизане",
    signin: "Регистрация",
    username: "Потребителско име",
    email: "Имейл",
    password: "Парола",
    forgotPassword: "Забравена парола",
    forgotPasswordTitle: "Нулиране на парола",
    forgotPasswordSubtitle:
      "Въведете имейл адреса си и ще ви изпратим линк за нулиране на паролата.",
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
    confirmPassword: "Потвърди парола",
    resetPassword: "Нулирай парола",
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
    incorrectPassword: "Грешна парола",
    invalidPassword: "Паролата трябва да отговаря на изискванията",
    passwordMinLength:
      "Паролата трябва да е поне 8 символа и да съдържа поне една главна буква, една малка буква, едно число и един специален символ",
    passwordsDoNotMatch: "Паролите не съвпадат",
    emailCannotBeEdited: "Имейлът не може да бъде редактиран",

    // User Profile
    memberSince: "Член от",
    posts: "Публикации",
    followers: "Последователи",
    following: "Следвани",
    admins: "Администратори",
    noPostsFound: "Няма публикации в тази категория",
    noFollowersFound: "Все още няма последователи",
    noFollowingFound: "Не следвате никого",
    waitingForApproval: "Чака за одобрение",
    bio: "Биография",
    editBio: "Редактирай биография",
    saveBio: "Запази биография",
    profilePictureUpdated: "Профилната снимка беше обновена",
    changeUsername: "Промени потребителско име",
    noBio: "Няма зададена биография",
    reportUsername: "Доклай потребител",
    confirmReportUser: "Сигурни ли сте, че искате да докладвате {username}",
    viewProfile: "Виж профил",
    userProfile: "Профил на потребител",

    // Categories & Tags
    category: "Категория",
    tag: "Таг",
    addCategory: "Добави категория",
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
    categoryNameEmpty: "Името на категорията не може да е празно",
    categoryNameTooLong:
      "Името на категорията не може да е по-дълго от 50 символа",
    categoryCreated: "Категорията е създадена успешно",
    categoryDeleted: "Категорията е изтрита успешно",
    categoryUpdated: "Категорията е обновена успешно",
    categoryDeleteFailed: "Неуспешно изтриване на категория",
    categoryUpdateFailed: "Неуспешно обновяване на категория",
    deleteCategoryError: "Неуспешно изтриване на категория",
    tagNameEmpty: "Името на тага не може да е празно",
    tagNameTooLong: "Името на тага не може да е по-дълго от 20 символа",
    tagCreated: "Тагът е създаден успешно",
    tagDeleted: "Тагът е изтрит успешно",
    tagUpdated: "Тагът е обновен успешно",
    tagUpdateFailed: "Неуспешно обновяване на таг",
    tagCreatedSuccess: "Тагът е създаден успешно",
    tagDeletedSuccess: "Тагът е изтрит успешно",
    tagUpdatedSuccess: "Тагът е обновен успешно",
    deleteTagWarning:
      "Сигурни ли сте, че искате да изтриете този таг? Това действие е необратимо",
    saveChanges: "Запази промените",

    // Admin
    addAdmin: "Добави администратор",
    createAdmin: "Създай администратор",
    enterAdminEmail: "Въведете имейл на администратор",
    adminEmailInfo:
      "Имейл за създаване на парола ще бъде изпратен на този адрес",
    adminAccountCreatedSuccess:
      "Администраторски акаунт създаден успешно! Имейл за настройка на парола изпратен.",
    failedToCreateAdmin: "Неуспешно създаване на администратор",
    allUsers: "Всички потребители",
    userNotFound: "Потребителът не е намерен",
    banUser: "Блокирай потребител",
    ban: "Блокирай",
    unban: "Разблокирай",
    confirmBan: "Потвърди блокиране",
    confirmUnban: "Потвърди разблокиране",
    banUserWarning:
      "Сигурни ли сте, че искате да блокирате {username}? Това действие ще изтрие цялото му съдържание и ще го спре от вход Действието може да бъде върнато, като се разблокира потребителя",
    unbanWarning:
      "Сигурни ли сте, че искате да разблокирате {username}? Те ще възстановят достъп до акаунта си",
    unbanUser: "Разблокирай потребител",
    unbanUserConfirm:
      "Сигурни ли сте, че искате да разблокирате {username}? Те ще възстановят достъп до акаунта си",
    bannedUsers: "Блокирани потребители",
    bannedAt: "Блокиран на",
    noBannedUsersFound: "Няма блокирани потребители",
    banned: "Блокиран",
    reasonForBan: "Причина за блокиране",
    reasonForBanPlaceholder: "Въведете причината за блокиране",
    confirmBanText:
      "Сигурни ли сте, че искате да блокирате {username}? Това ще блокира потребителя Действието може да бъде върнато",
    adminUsernameEditDisabled:
      "Вашата роля не ви позволява да редактирате потребителското си име Моля, свържете се с ръководител",
    adminDeleteAccountDisabled:
      "Вашата роля не ви позволява да изтриете акаунта си Моля, свържете се с ръководител",
    adminSettings: "Администраторски настройки",
    adminSettingsPlaceholder: "Настройки на администратора",
    adminSettingsDescription:
      "Тази страница съдържа административни и модераторски настройки",

    // Admin Dashboard
    toReview: "За преглед",
    reports: "Доклади",
    users: "Потребители",
    tags: "Тагове",
    categories: "Категории",

    // Reports
    report: "Доклад",
    reasonForReport: "Причина за доклад",
    reportSubmitted: "Докладът беше изпратен успешно",
    reportPost: "Доклай публикация",
    reportComment: "Доклай коментар",
    reportUser: "Доклай потребител",
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
    contentDetails: "Детайли за съдържанието",
    type: "Тип",
    author: "Автор",

    // Comments
    comments: "Коментари",
    writeComment: "Напишете коментар",
    postComment: "Публикувай коментар",
    commentAdded: "Коментарът беше добавен успешно",
    commentCannotBeEmpty: "Коментарът не може да бъде празен",
    mustBeLoggedInToComment:
      "Моля, влезте в системата, за да оставите коментар",
    confirmDeleteComment: "Сигурни ли сте, че искате да изтриете този коментар",

    // Content Approval
    approve: "Одобри",
    disapprove: "Отхвърли",
    resolve: "Разреши",
    reject: "Отхвърли",
    reasonForRejecting: "Причина за отхвърляне",
    enterReason: "Въведете причина за отхвърляне",
    submitRejection: "Изпрати отхвърляне",
    reasonForNotAllowing: "Причина за отхвърляне",
    enterReasonForDisapproval: "Въведете причина за отхвърляне",
    submitDisapproval: "Изпрати отхвърляне",
    contentApprovedSuccess: "Съдържанието е одобрено успешно",
    contentDisapprovedSuccess: "Съдържанието е отхвърлено успешно",
    pleaseProvideDisapprovalReason: "Моля, въведете причина за отхвърляне",
    failedToApproveContent: "Неуспешно одобряване на съдържание",
    failedToDisapproveContent: "Неуспешно отхвърляне на съдържание",

    // Notifications
    refresh: "Освежи",
    refreshNotifications: "Освежи известията",
    markAllAsRead: "Отбеляжи всички като прочетени",
    clearAll: "Изчисти всички",
    deleteNotification: "Изтрий известието",
    clearAllConfirm: "Сигурни ли сте, че искате да изтриете всички известия",
    confirmAction: "Потвърди действие",
    allNotificationsCleared: "Всички известия са изчистени",
    notificationDeleted: "Изведението е изтрито",
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

    // User Search
    noUsersFound: "Няма намерени потребители",
    noSearchResults: "Няма потребители, отговарящи на търсенето",

    // Follow System
    follow: "Следвай",
    unfollow: "Отстрани",
    followStatusUpdated: "Статусът на следване е актуализиран",
    unfollowed: "Успешно премахнахте следването",
    followed: "Успешно последвате",
    successfullyFollowedUser: "Успешно последвахте потребителя",
    successfullyUnfollowedUser: "Успешно премахнахте следването на потребителя",
    actionFailed: "Действието не беше успешно",

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

    // Post Upload
    uploadPost: "Качване на публикация",
    files: "Файлове",
    browseFiles: "Преглед на файлове",
    supportedFormats:
      "Поддържани формати: JPEG, PNG, WebP (проверено от AI модел)",
    title: "Заглавие",
    briefDescription: "Кратко описание на качвания файл",
    description: "Описание",
    detailedDescription: "Подробно описание на това, което сте качили",
    uploading: "Качване...",
    selectFileError: "Моля, изберете поне един файл",
    selectCategoryError: "Моля, изберете категория",
    enterTitleError: "Моля, въведете заглавие",
    enterDescriptionError: "Моля, въведете описание",
    filesSkippedError:
      "Някои файлове бяха пропуснати Поддържат се само JPEG, PNG и WebP формати",
    uploadSuccess:
      "Успех Вашата публикация изчаква проверка Ще бъдете уведомени, когато бъде одобрена/отхвърлена",
    somethingWentWrong: "Нещо се обърка",

    // Account Settings
    changePassword: "Промени парола",
    appTheme: "Тема на приложението",
    language: "Език",
    rememberMe: "ЗАПОМНИ МЕ",
    onlyJPGE: "Поддържат се само JPEG, PNG и WebP формати",
    invalidResetLink:
      "Невалиден линк за нулиране Моля, изпращете нов заявка за нулиране на парола",
    passwordResetSuccess: "Паролата е нулирана успешно",
    fillAllPasswordFields: "Моля, попълнете всички полета за парола",
    passwordChangedSuccess: "Паролата е променена успешно",
    settingsSavedSuccess: "Настройките са запазени успешно",
    emailUpdatedSuccess:
      "Имейлът е обновен успешно Моля, проверете отново ако е необходимо",
    invalidOrMissingToken: "Невалиден или липсващ токен",
    passwordSetSuccess: "Паролата е зададена успешно Пренасочване към входа",
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
    viewOriginal: "Виж оригинала",
    noComments: "Няма коментари все още",
    commentDeleted: "Коментарът беше изтрит успешно",
    like: "Харесва",
    likes: "Харесвания",
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
    failedLoadFeed: "Неуспешно зареждане на лента",
    failedLoadMore: "Неуспешно зареждане на още",
    noMorePosts: "Няма повече публикации",
    postsFromFollowed: "Публикации от хора, които следвате",
    suggestedForYou: "Препоръчани за теб",
    noSuggestedPosts: "Няма препоръчани публикации",
    noFollowedPosts:
      "Все още не следвате никого Следвайте потребители, за да видите техните публикации тук",
    welcome: "Добре дошли",
    welcomeMessage:
      "Следвайте потребители, за да видите техните публикации тук или разгледайте препоръчаното съдържание по-долу",

    // Generic errors
    failedLoadTags: "Неуспешно зареждане на тагове",
    failedCreateTag: "Неуспешно създаване на таг",
    failedDeleteTag: "Неуспешно изтриване на таг",
    failedUpdateTag: "Неуспешно обновяване на таг",
    failedLoadUsers: "Неуспешно зареждане на потребители",
    failedDeleteUser: "Неуспешно изтриване на потребител",
    failedCreateAdmin: "Неуспешно създаване на администратор",
    failedToDeleteUser: "Неуспешно изтриване на потребител",

    // Landing Page
    landingWelcome: "Добре дошли в MangoTree",
    landingTagline:
      "Свързвай се, споделяй и растей с общност, която има значение.",
    landingDescription:
      "MangoTree е социална платформа, където можеш да споделяш мислите си, да откриваш ново съдържание и да се свързваш с хора с подобни интереси. Присъединете се към общността ни днес и започнете пътя си.",
    getStarted: "Започни",
    feature1Title: "Сподели гласа си",
    feature1Desc:
      "Създавайте публикации, изразявайте идеите си и нека креативността ви блесне.",
    feature2Title: "Открий съдържание",
    feature2Desc:
      "Разглеждайте персонализирани ленти и изследвайте съдържание, създадено специално за вас.",
    feature3Title: "Свързвай се и ангажирай",
    feature3Desc:
      "Следвайте потребители, коментирайте публикации и изграждайте значими връзки.",
    landingFooter: "Вече имате акаунт? Влезте в системата, за да продължите.",
  },
};

export const getTranslation = (language: Language, key: string): string => {
  return translations[language][key] || key;
};
