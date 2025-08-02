-- CreateTable
CREATE TABLE `Movie` (
    `id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `overview` VARCHAR(191) NULL,
    `vote_average` DOUBLE NULL,
    `vote_count` INTEGER NULL,
    `release_date` DATETIME(3) NULL,
    `poster_path` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Genre` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovieGenre` (
    `movieId` INTEGER NOT NULL,
    `genreId` INTEGER NOT NULL,

    PRIMARY KEY (`movieId`, `genreId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cast` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `gender` INTEGER NULL,
    `profile_path` VARCHAR(191) NULL,
    `popularity` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovieCast` (
    `movieId` INTEGER NOT NULL,
    `castId` INTEGER NOT NULL,
    `character` VARCHAR(191) NULL,
    `order` INTEGER NULL,

    PRIMARY KEY (`movieId`, `castId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MovieGenre` ADD CONSTRAINT `MovieGenre_movieId_fkey` FOREIGN KEY (`movieId`) REFERENCES `Movie`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovieGenre` ADD CONSTRAINT `MovieGenre_genreId_fkey` FOREIGN KEY (`genreId`) REFERENCES `Genre`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovieCast` ADD CONSTRAINT `MovieCast_movieId_fkey` FOREIGN KEY (`movieId`) REFERENCES `Movie`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovieCast` ADD CONSTRAINT `MovieCast_castId_fkey` FOREIGN KEY (`castId`) REFERENCES `Cast`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
