import Foundation

enum CSVImportError: LocalizedError {
    case emptyFile
    case invalidHeader
    case readFailed(String)

    var errorDescription: String? {
        switch self {
        case .emptyFile: return "Le fichier CSV est vide."
        case .invalidHeader: return "En-tête CSV invalide. Colonnes attendues : date, libellé, montant."
        case .readFailed(let reason): return "Lecture impossible : \(reason)"
        }
    }
}

struct CSVImporter {
    private static let dateFormatters: [DateFormatter] = {
        ["yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "MM/dd/yyyy"].map { format in
            let f = DateFormatter()
            f.locale = Locale(identifier: "en_US_POSIX")
            f.dateFormat = format
            return f
        }
    }()

    static func importTransactions(from url: URL) throws -> [Transaction] {
        let didAccess = url.startAccessingSecurityScopedResource()
        defer { if didAccess { url.stopAccessingSecurityScopedResource() } }

        let data: String
        do {
            data = try String(contentsOf: url, encoding: .utf8)
        } catch {
            if let iso = try? String(contentsOf: url, encoding: .isoLatin1) {
                data = iso
            } else {
                throw CSVImportError.readFailed(error.localizedDescription)
            }
        }
        return try parse(data)
    }

    static func parse(_ content: String) throws -> [Transaction] {
        let lines = content.split(whereSeparator: \.isNewline).map(String.init)
        guard lines.count > 1 else { throw CSVImportError.emptyFile }

        let separator = detectSeparator(lines[0])
        let header = splitLine(lines[0], separator: separator).map {
            $0.lowercased().trimmingCharacters(in: .whitespaces)
        }

        guard
            let dateIdx = header.firstIndex(where: { $0.contains("date") }),
            let labelIdx = header.firstIndex(where: {
                $0.contains("libell") || $0.contains("label") ||
                $0.contains("description") || $0.contains("intitul")
            }),
            let amountIdx = header.firstIndex(where: {
                $0.contains("montant") || $0.contains("amount")
            })
        else {
            throw CSVImportError.invalidHeader
        }

        var transactions: [Transaction] = []
        for raw in lines.dropFirst() {
            let fields = splitLine(raw, separator: separator)
            guard fields.count > max(dateIdx, labelIdx, amountIdx) else { continue }

            let label = fields[labelIdx].trimmingCharacters(in: .whitespacesAndNewlines)
            guard let date = parseDate(fields[dateIdx]),
                  let amount = parseAmount(fields[amountIdx]) else { continue }

            let category = TransactionClassifier.classify(label: label, amount: amount)
            transactions.append(Transaction(
                date: date, label: label, amount: amount, category: category
            ))
        }
        return transactions
    }

    private static func detectSeparator(_ line: String) -> Character {
        let semis = line.filter { $0 == ";" }.count
        let commas = line.filter { $0 == "," }.count
        return semis >= commas ? ";" : ","
    }

    private static func splitLine(_ line: String, separator: Character) -> [String] {
        var fields: [String] = []
        var current = ""
        var inQuotes = false
        for ch in line {
            if ch == "\"" {
                inQuotes.toggle()
            } else if ch == separator && !inQuotes {
                fields.append(current)
                current = ""
            } else {
                current.append(ch)
            }
        }
        fields.append(current)
        return fields.map { $0.trimmingCharacters(in: CharacterSet(charactersIn: "\"")) }
    }

    private static func parseDate(_ raw: String) -> Date? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        for formatter in dateFormatters {
            if let date = formatter.date(from: trimmed) { return date }
        }
        return nil
    }

    private static func parseAmount(_ raw: String) -> Decimal? {
        let cleaned = raw
            .replacingOccurrences(of: "€", with: "")
            .replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: "\u{00A0}", with: "")
            .replacingOccurrences(of: ",", with: ".")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return Decimal(string: cleaned)
    }
}
