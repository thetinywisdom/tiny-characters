import CoreText
import Foundation

/// DotGothic16 (SIL Open Font License, Fonts/DotGothic16-OFL.txt), the font of
/// the town's signs, registered for this app at launch.
enum PixelFont {
    private(set) static var name = "Menlo"

    static func register() {
        guard let url = Bundle.main.url(forResource: "DotGothic16-Regular", withExtension: "ttf")
                ?? Bundle.main.url(forResource: "DotGothic16-Regular", withExtension: "ttf", subdirectory: "Fonts") else { return }
        CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        if let descs = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor],
           let first = descs.first,
           let ps = CTFontDescriptorCopyAttribute(first, kCTFontNameAttribute) as? String {
            name = ps
        }
    }
}
