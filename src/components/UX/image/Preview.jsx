import { Image } from "antd"

export const ImagePreviewClickable = ({ imageUrlGenerated, width = 200, items }) => {
    return <Image.PreviewGroup items={items}>
        <Image
            alt="webp image"
            width={width}
            src={imageUrlGenerated}
        />
    </Image.PreviewGroup>
}