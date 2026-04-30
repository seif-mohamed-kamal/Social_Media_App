"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const config_service_1 = require("../../config/config.service");
const crypto_1 = require("crypto");
const domain_exception_1 = require("../exceptions/domain.exception");
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const enum_1 = require("../enum");
const fs_1 = require("fs");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_service_1.AWS_REGION,
            credentials: {
                accessKeyId: config_service_1.AWS_ACCESS_KEY_ID,
                secretAccessKey: config_service_1.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadAsset({ storageApproch = enum_1.storageApproachEnum.DISK, Bucket = config_service_1.AWS_BACKET_NAME, Path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, ContentType, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `SocialMedia/${Path}/${(0, crypto_1.randomUUID)()}__${file.originalname}`,
            ACL,
            Body: file.buffer,
            ContentType: file.mimetype ?? ContentType,
        });
        if (!command.input?.Key) {
            throw new domain_exception_1.BadRequestException("Fail to upload this Asset");
        }
        await this.client.send(command);
        return command.input?.Key;
    }
    async uploadLargeFile({ storageApproch = enum_1.storageApproachEnum.DISK, Bucket = config_service_1.AWS_BACKET_NAME, Path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, ContentType, partSize = 5, }) {
        const uploadFile = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket,
                Key: `SocialMedia/${Path}/${(0, crypto_1.randomUUID)()}__${file.originalname}`,
                ACL,
                Body: storageApproch === enum_1.storageApproachEnum.MEMORY
                    ? file.buffer
                    : (0, fs_1.createReadStream)(file.path),
                ContentType: file.mimetype ?? ContentType,
            },
            partSize: partSize * 1024 * 1024,
        });
        return await uploadFile.done();
    }
    async uploadBulkAsset({ uploadApproach = enum_1.uploadApproachEnum.SMALL, storageApproch = enum_1.storageApproachEnum.DISK, Bucket = config_service_1.AWS_BACKET_NAME, Path = "general", files, ACL = client_s3_1.ObjectCannedACL.private, ContentType, }) {
        let urls = [];
        if (uploadApproach === enum_1.uploadApproachEnum.LARGE) {
            let data = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({
                    storageApproch,
                    file,
                    ACL,
                    Bucket,
                    ContentType,
                    Path,
                });
            }));
            urls = data.map((ele) => ele.Key);
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadAsset({
                    storageApproch,
                    file,
                    ACL,
                    Bucket,
                    ContentType,
                    Path,
                });
            }));
        }
        return urls;
    }
    async createPreSignedUploadLink({ Bucket = config_service_1.AWS_BACKET_NAME, Path = "general", OriginalName, expiresIn = config_service_1.AWS_EXPIRES_IN, ContentType, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `SocialMedia/${Path}/${(0, crypto_1.randomUUID)()}__${OriginalName}`,
            ContentType,
        });
        if (!command.input?.Key) {
            throw new domain_exception_1.BadRequestException("Fail to upload this Asset");
        }
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, key: command.input?.Key };
    }
    async getAsset({ Bucket = config_service_1.AWS_BACKET_NAME, Key, }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
        });
        return await this.client.send(command);
    }
    async createPreSignedFetchLink({ Bucket = config_service_1.AWS_BACKET_NAME, Key, fileName, download, expiresIn = config_service_1.AWS_EXPIRES_IN, }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: download == "true"
                ? `attachment; filename="${fileName || Key.split("/").pop()}"`
                : undefined,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return url;
    }
    async deleteAsset({ Bucket = config_service_1.AWS_BACKET_NAME, Key, }) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket,
            Key,
        });
        return await this.client.send(command);
    }
    async deleteBulkAsset({ Bucket = config_service_1.AWS_BACKET_NAME, Keys, }) {
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket,
            Delete: {
                Objects: Keys,
                Quiet: false,
            },
        });
        return await this.client.send(command);
    }
    async listFolderDir({ Bucket = config_service_1.AWS_BACKET_NAME, Prefix, }) {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket,
            Prefix: `${config_service_1.APPLICATION_NAME}/${Prefix}`,
        });
        return await this.client.send(command);
    }
    async delteFolderByPrefix({ Bucket = config_service_1.AWS_BACKET_NAME, Prefix, }) {
        const res = await this.listFolderDir({ Bucket, Prefix });
        console.log(res.Contents);
        const Keys = res.Contents?.map((ele) => {
            return { Key: ele.Key };
        });
        return await this.deleteBulkAsset({ Bucket, Keys });
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
