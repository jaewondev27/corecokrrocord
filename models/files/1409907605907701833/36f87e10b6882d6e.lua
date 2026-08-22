local GroupService = game:GetService("GroupService")
local Players = game:GetService("Players")

-- 여기에 원하는 그룹 ID를 입력하세요
local REQUIRED_GROUP_ID = 12345678 -- 실제 그룹 ID로 변경해주세요

local function checkGroupMembership(player)
	local success, isInGroup = pcall(function()
		return player:IsInGroup(REQUIRED_GROUP_ID)
	end)

	if success then
		if not isInGroup then
			print(player.Name .. "은(는) 필요한 그룹에 가입하지 않았습니다.")

			local message = Instance.new("Message")
			message.Text = "이 게임에 접속하려면 그룹에 가입해야 합니다"
			message.Parent = player.PlayerGui

			wait(3)
			player:Kick("그룹에 가입 후 다시 접속해주세요. 그룹 ID: " .. REQUIRED_GROUP_ID)
		else
			print(player.Name .. "은(는) 그룹 멤버입니다. 환영합니다!")
		end
	else
		warn("그룹 확인 중 오류 발생: " .. player.Name)
	end
end

Players.PlayerAdded:Connect(function(player)
	wait(1)
	checkGroupMembership(player)
end)

for _, player in pairs(Players:GetPlayers()) do
	spawn(function()
		checkGroupMembership(player)
	end)
end