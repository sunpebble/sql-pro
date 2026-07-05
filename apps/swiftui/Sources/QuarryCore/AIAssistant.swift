import Foundation

public struct AISettings: Equatable {
  public var endpoint: String
  public var model: String
  public var apiKey: String

  public init(endpoint: String = "https://api.openai.com", model: String = "gpt-5.5", apiKey: String = "") {
    self.endpoint = endpoint
    self.model = model
    self.apiKey = apiKey
  }
}

public enum AIAssistant {
  public static func sqlGenerationPrompt(request: String, schema: String) -> String {
    """
    Generate one SQLite query for the user's request.
    Return SQL only. Do not use markdown fences.

    Schema:
    \(schema)

    Request:
    \(request)
    """
  }

  public static func sqlExplanationPrompt(sql: String, schema: String) -> String {
    """
    Explain this SQLite query for a database user.
    Keep it concise and call out tables, filters, joins, grouping, sorting, and risk.

    Schema:
    \(schema)

    SQL:
    \(sql)
    """
  }

  public static func extractSQL(_ text: String) -> String {
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard trimmed.hasPrefix("```") else { return trimmed }

    let lines = trimmed.split(separator: "\n", omittingEmptySubsequences: false)
    guard lines.count >= 3 else { return trimmed }
    return lines
      .dropFirst()
      .dropLast()
      .joined(separator: "\n")
      .trimmingCharacters(in: .whitespacesAndNewlines)
  }
}

public final class OpenAICompatibleClient {
  private let session: URLSession

  public init(session: URLSession = .shared) {
    self.session = session
  }

  public func complete(settings: AISettings, system: String, user: String) async throws -> String {
    guard !settings.apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      throw URLError(.userAuthenticationRequired)
    }
    guard let url = Self.chatCompletionsURL(endpoint: settings.endpoint) else {
      throw URLError(.badURL)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(settings.apiKey)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(
      ChatCompletionRequest(
        model: settings.model,
        messages: [
          ChatMessage(role: "system", content: system),
          ChatMessage(role: "user", content: user),
        ],
        temperature: 0.1
      )
    )

    let (data, response) = try await session.data(for: request)
    if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
      let body = String(data: data, encoding: .utf8) ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
      throw NSError(domain: "OpenAICompatibleClient", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: body])
    }

    let decoded = try JSONDecoder().decode(ChatCompletionResponse.self, from: data)
    return decoded.choices.first?.message.content.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
  }

  public static func chatCompletionsURL(endpoint: String) -> URL? {
    guard var components = URLComponents(string: endpoint.trimmingCharacters(in: .whitespacesAndNewlines)) else {
      return nil
    }

    let path = components.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    if path.isEmpty {
      components.path = "/v1/chat/completions"
    } else {
      components.path = path.hasSuffix("v1") ? "/\(path)/chat/completions" : "/\(path)/v1/chat/completions"
    }
    return components.url
  }
}

private struct ChatCompletionRequest: Encodable {
  let model: String
  let messages: [ChatMessage]
  let temperature: Double
}

private struct ChatMessage: Codable {
  let role: String
  let content: String
}

private struct ChatCompletionResponse: Decodable {
  struct Choice: Decodable {
    let message: ChatMessage
  }

  let choices: [Choice]
}
